import { ASTNode, ElementNode, IRAttr, IRNode, IRText, RenderModule } from "./types.js";

export function astToRenderIR(ast: ASTNode[]): RenderModule {
  const localsStack: Array<Set<string>> = [new Set()];
  const reserved = new Set(['true','false','null','undefined','this']);
  let script = '';

  const inScope = () => localsStack[localsStack.length - 1];

  const splitDeps = (expr: string) => {
    const state = new Set<string>(), local = new Set<string>();
    const re = /[A-Za-z_][A-Za-z0-9_]*/g; let m: RegExpExecArray | null;
    const scope = inScope();
    while ((m = re.exec(expr))) {
      const id = m[0];
      if (reserved.has(id)) continue;
      (scope.has(id) ? local : state).add(id);
    }
    return { stateDeps: [...state], localDeps: [...local] };
  };

  const normEvent = (name: string) => {
    if (name.startsWith('@')) return name.slice(1);
    if (name.startsWith('on:')) return name.slice(3);
    return null;
  };

  const classes = new Set<string>();
  function collectClasses(classAttr: string){
    classAttr.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }
  function collectClassesFromExpr(expr: string){
    // 1) quoted strings
    for (const m of expr.matchAll(/(['"])(.*?)\1/g)) collectClasses(m[2]);
    // 2) template literals: only static parts
    for (const m of expr.matchAll(/`([^`]*)`/g)) {
      m[1].split(/\$\{[^}]+\}/g).forEach(frag => collectClasses(frag));
    }
    // 3) arrays/objects: grab any bare words inside
    for (const m of expr.matchAll(/\[(.*?)\]|\{([^}]+)\}/g)) {
      collectClasses((m[1] || m[2] || '').replace(/[:,]/g,' '));
    }
  }

  // helper: get dynamic attr expr from parser value variants
  const braceExpr = /^\{([^}]+)\}$/;
  function getDynamicAttrExpr(a: any): string | null {
    if (a && typeof a === 'object' && 'expr' in a && typeof a.expr === 'string') {
      return a.expr.trim();
    }
    if (typeof a?.value === 'string') {
      const m = a.value.match(braceExpr);
      if (m) return m[1].trim();
    }
    return null;
  }

  // optional: stable ids for dynamic attrs if your emitter wants them
  let dynAttrSeq = 0;
  const nextDynAttrId = () => `attr${dynAttrSeq++}`;

  const visit = (n: ASTNode): IRNode | null => {
    switch (n.kind) {
      case 'Text':
        return { k: 'staticText', value: n.value };

      case 'Mustache': {
        const { stateDeps, localDeps } = splitDeps(n.expr);
        return { k:'text', expr:n.expr, stateDeps, localDeps };
      }

      case 'Element': {
        // hoist raw <script> contents
        if (n.tag.toLowerCase() === 'script') {
          for (const c of n.children) if ((c as any).kind === 'Text') script += (c as any).value;
          return null;
        }

        const attrs: IRAttr[] = [];
        const on: { evt: string; handler: string }[] = [];

        for (const a of n.attrs as any[]) {
          // events
          const evt = normEvent(a.name);
          if (evt) {
            on.push({ evt, handler: String(a.value ?? '') });
            continue;
          }

          // boolean / present-only
          if (a.value === true || (a.value == null && !('expr' in a))) {
            if (a.name === 'class') {/* no-op collect for boolean class */}
            attrs.push({ kind:'static', name:a.name, value:true } as any);
            continue;
          }

          // dynamic: either explicit a.expr or "{ … }" wrapper
          const expr = getDynamicAttrExpr(a);
          if (expr != null) {
            const { stateDeps, localDeps } = splitDeps(expr);
            if (a.name === 'class' || a.name === 'className') collectClassesFromExpr(expr);
            attrs.push({
              kind: 'dynamic',
              id: nextDynAttrId(),         // optional; include if your emitter wants stable names
              name: a.name,
              expr,
              stateDeps,
              localDeps
            } as any);
            continue;
          }

          // static string/number
          const val = String(a.value ?? '');
          if (a.name === 'class' || a.name === 'className') collectClasses(val);
          attrs.push({ kind:'static', name:a.name, value: val } as any);
        }

        return {
          k:'elem',
          tag:n.tag,
          attrs,
          on,
          children: coalesceStatics(n.children.map(visit).filter(Boolean) as IRNode[])
        };
      }

      case 'IfBlock': {
        const branches = n.branches.map(br => {
          const { stateDeps, localDeps } = splitDeps(br.expr);
          return {
            expr: br.expr,
            stateDeps,
            localDeps,
            node: wrapChildren(br.children.map(visit).filter(Boolean) as IRNode[])
          };
        });
        const elseNode = n.elseChildren?.length
          ? wrapChildren(n.elseChildren.map(visit).filter(Boolean) as IRNode[])
          : undefined;
        return { k:'if', branches, elseNode };
      }

      case 'EachBlock': {
        const { itemName, indexName } = n;
        const { stateDeps: listStateDeps, localDeps: listLocalDeps } = splitDeps(n.listExpr);

        const childScope = new Set(inScope());
        childScope.add(itemName);
        if (indexName) childScope.add(indexName);
        localsStack.push(childScope);

        const node = wrapChildren(n.children.map(visit).filter(Boolean) as IRNode[]);

        localsStack.pop();

        return {
          k:'each',
          listExpr: n.listExpr,
          listStateDeps,
          listLocalDeps,
          item: itemName,
          index: indexName,
          node
        };
      }
    }
  };

  const wrapChildren = (kids: IRNode[]): IRNode =>
    kids.length === 1 ? kids[0] : ({ k: 'fragment', children: coalesceStatics(kids) });

  const coalesceStatics = (kids: (IRNode|null)[]): IRNode[] => {
    const out: IRNode[] = [];
    for (const k of kids) {
      if (!k) continue;
      const last = out[out.length - 1];
      if (last && last.k === 'staticText' && k.k === 'staticText') {
        (last as any).value += (k as any).value;
      } else {
        out.push(k);
      }
    }
    return out;
  };

  const nodes = ast.map(visit).filter(Boolean) as IRNode[];
  return { nodes, script };
}
