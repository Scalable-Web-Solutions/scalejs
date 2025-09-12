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
  // 1) single/double-quoted string literals
  for (const m of expr.matchAll(/(['"])(.*?)\1/g)) {
    collectClasses(m[2]);
  }
  // 2) template literals: collect only the static parts (before/after ${})
  for (const m of expr.matchAll(/`([^`]*)`/g)) {
    // split out ${...} and keep literal fragments
    m[1].split(/\$\{[^}]+\}/g).forEach(frag => collectClasses(frag));
  }
  // 3) array/object of classes: ['a','b'] or {a:cond,b:cond}
  //    (strings already caught by (1); this is just for cases like ['a b', 'c'])
  for (const m of expr.matchAll(/\[(.*?)\]|\{([^}]+)\}/g)) {
    collectClasses(m[1] || m[2]);
  }
}


  // ⬇️ your existing visit, with ONE tiny tweak in the Element case
  const visit = (n: ASTNode): IRNode | null => {
    switch (n.kind) {
      case 'Text':        return { k: 'staticText', value: n.value };
      case 'Mustache': {  const { stateDeps, localDeps } = splitDeps(n.expr); return { k:'text', expr:n.expr, stateDeps, localDeps }; }

      case 'Element': {
        // NEW: raw-text <script> hoist & drop from DOM IR
        if (n.tag.toLowerCase() === 'script') {
          // collect raw text from its children (you already made <script> raw in the parser)
          for (const c of n.children) if (c.kind === 'Text') script += c.value;
          return null; // do not render a <script> element
        }

        const attrs: IRAttr[] = [];
        const on: { evt: string; handler: string }[] = [];
        for (const a of n.attrs) {
          const evt = normEvent(a.name);
          if (evt) { on.push({ evt, handler: String(a.value) }); continue; }
          if (a.value === true) {
            if(a.name === 'class'){}
            attrs.push({ kind:'static', name:a.name, value:true }); continue;
          }
          const val = String(a.value);
          const m = val.match(/^\{([^}]+)\}$/);
          if (m) {
            const expr = m[1].trim();
            const { stateDeps, localDeps } = splitDeps(expr);
            attrs.push({ kind:'dynamic', name:a.name, expr, stateDeps, localDeps });
          } else {
            if(a.name === 'class' || a.name === 'className') {
              collectClasses(val);
            }
            attrs.push({ kind:'static', name:a.name, value: val });
          }
        }
        return { k:'elem', tag:n.tag, attrs, on, children: coalesceStatics(n.children.map(visit).filter(Boolean) as IRNode[]) };
      }

      case 'IfBlock': {
        const branches = n.branches.map(br => {
          const { stateDeps, localDeps } = splitDeps(br.expr);
          return { expr: br.expr, stateDeps, localDeps, node: wrapChildren(br.children.map(visit).filter(Boolean) as IRNode[]) };
        });
        const elseNode = n.elseChildren?.length ? wrapChildren(n.elseChildren.map(visit).filter(Boolean) as IRNode[]) : undefined;
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

        return { k:'each', listExpr: n.listExpr, listStateDeps, listLocalDeps, item: itemName, index: indexName, node };
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