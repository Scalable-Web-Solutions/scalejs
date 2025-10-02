import { ASTNode, ElementNode, IRAttr, IRNode, IRText, RenderModule } from "./types.js";

export function astToRenderIR(ast: ASTNode[]): RenderModule {
  const localsStack: Array<Set<string>> = [new Set()];
  const reserved = new Set(['true', 'false', 'null', 'undefined', 'this']);
  let script = '';

  const inScope = () => localsStack[localsStack.length - 1];

  const splitDeps = (expr: string) => {
    const state = new Set<string>(), local = new Set<string>();
    const scope = inScope();

    if (expr.startsWith('`') && expr.endsWith('`')) {
      const interpolations = expr.match(/\$\{([^}]+)\}/g) || [];
      for (const interp of interpolations) {
        const content = interp.slice(2, -1);
        const re = /[A-Za-z_][A-Za-z0-9_]*/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
          const id = m[0];
          if (reserved.has(id)) continue;
          (scope.has(id) ? local : state).add(id);
        }
      }
    } else {
      const re = /[A-Za-z_][A-Za-z0-9_]*/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(expr))) {
        const id = m[0];
        if (reserved.has(id)) continue;
        (scope.has(id) ? local : state).add(id);
      }
    }

    return { stateDeps: [...state], localDeps: [...local] };
  };

  const normEvent = (name: string) => {
    if (name.startsWith('@')) return name.slice(1);
    if (name.startsWith('on:')) return name.slice(3);
    return null;
  };

  function collectClassesInto(classAttr: string, targetSet: Set<string>) {
    classAttr.split(/\s+/).filter(Boolean).forEach(c => targetSet.add(c));
  }

  function collectClassesFromExprInto(expr: string, targetSet: Set<string>) {
    // quoted strings
    for (const m of expr.matchAll(/(['"])(.*?)\1/g)) {
      collectClassesInto(m[2], targetSet);
    }
    // template literals: only static parts
    for (const m of expr.matchAll(/`([^`]*)`/g)) {
      m[1].split(/\$\{[^}]+\}/g).forEach(frag => collectClassesInto(frag, targetSet));
    }
    // arrays/objects: bare words inside
    for (const m of expr.matchAll(/\[(.*?)\]|\{([^}]+)\}/g)) {
      collectClassesInto((m[1] || m[2] || '').replace(/[:,]/g, ' '), targetSet);
    }
  }

  const braceExpr = /^\{(.+)\}$/s;

  // PATCHED: extract inner expression from template literals with single interpolation like `${testClass}`,
  // so that emitted expression is just 'testClass' instead of the full template string.
  function getDynamicAttrExpr(a: any): string | null {
    if (typeof a?.value === 'string') {
      const braceMatch = a.value.match(braceExpr);
      if (braceMatch) {
        const expr = braceMatch[1].trim();
        if (expr) {
          return expr;
        }
      }
      if (a.value.startsWith('`') && a.value.endsWith('`')) {
        const inner = a.value.slice(1, -1);
        // Detect if inner matches exactly one interpolation ${...}
        const match = inner.match(/^\$\{(.+)\}$/);
        if (match) {
          // Return the inner expression without backticks or ${}
          return match[1].trim();
        }
        // If no match, fallback to returning original value (could be multi-part or complex template literal)
        return a.value;
      }
    }
    if (a && typeof a === 'object' && 'expr' in a && typeof a.expr === 'string') {
      return a.expr.trim();
    }
    return null;
  }

  const visit = (n: ASTNode): IRNode | null => {
    switch (n.kind) {
      case 'Text':
        return { k: 'staticText', value: n.value };

      case 'Mustache': {
        const { stateDeps, localDeps } = splitDeps(n.expr);
        return { k: 'text', expr: n.expr, stateDeps, localDeps };
      }

      case 'Element': {
        if (n.tag.toLowerCase() === 'script') {
          for (const c of n.children) {
            if (c.kind === 'Text') script += c.value;
          }
          return null;
        }

        const attrs: IRAttr[] = [];
        const on: { evt: string; handler: string; stateDeps: string[]; localDeps: string[] }[] = [];

        // New: per-element static class collection set for Tailwind hints only
        const tailwindHints = new Set<string>();

        for (const a of n.attrs) {
          // Handle events
          const evt = normEvent(a.name);
          if (evt) {
            let handler = '';
            const dynamicExpr = getDynamicAttrExpr(a);
            if (dynamicExpr) {
              handler = dynamicExpr.startsWith('{') && dynamicExpr.endsWith('}')
                ? dynamicExpr.slice(1, -1).trim()
                : dynamicExpr;
              
              // Fix: Ensure bare identifiers are invoked as functions
              if (handler && !handler.includes('(') && !handler.includes('=>')) {
                // Check if it's a simple identifier (not a complex expression)
                const isSimpleIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(handler.trim());
                if (isSimpleIdentifier) {
                  handler = `${handler}(ev)`;
                }
              }
            } else if (a.value === true || a.value == null) {
              handler = `${evt}()`;
            } else if (typeof a.value === 'string') {
              handler = a.value.trim();
            }
            const { stateDeps, localDeps } = splitDeps(handler);
            on.push({ evt, handler, stateDeps, localDeps });
            continue;
          }

          // boolean attributes
          if (a.value === true) {
            if (a.name === 'class') { /* no-op */ }
            attrs.push({ kind: 'static', name: a.name, value: true });
            continue;
          }

          // dynamic expressions
          const expr = getDynamicAttrExpr(a);
          if (expr != null) {
            const { stateDeps, localDeps } = splitDeps(expr);
            if (a.name === 'class' || a.name === 'className') {
              // Only collect for Tailwind hints, not for runtime class attribute
              collectClassesFromExprInto(expr, tailwindHints);
            }
            attrs.push({
              kind: 'dynamic',
              name: a.name,
              expr,
              stateDeps,
              localDeps
            });
            continue;
          }

          // static string/number
          const val = String(a.value ?? '');
          if (a.name === 'class' || a.name === 'className') {
            // Only collect for Tailwind hints, not for runtime class attribute
            collectClassesInto(val, tailwindHints);
          }
          attrs.push({ kind: 'static', name: a.name, value: val });
        }

        // Note: We no longer merge tailwindHints into the actual class attribute
        // This prevents conditionally-applied classes from being permanently stuck on elements
        // The tailwindHints are collected for build-time analysis only

        return {
          k: 'elem',
          tag: n.tag,
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
        return { k: 'if', branches, elseNode };
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
          k: 'each',
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

  const coalesceStatics = (kids: (IRNode | null)[]): IRNode[] => {
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
  // Gather Tailwind hints from any element attrs we collected locally
  const tw = new Set<string>();
  // Since we only collected into a local set per element, re-scan attributes for static strings
  // and strings inside dynamic expressions to extract possible class tokens for Tailwind JIT.
  const visitForHints = (node: IRNode) => {
    if (node.k === 'elem') {
      for (const a of node.attrs) {
        if (a.name === 'class' || a.name === 'className') {
          if (a.kind === 'static' && typeof a.value === 'string') {
            a.value.split(/\s+/).filter(Boolean).forEach(c => tw.add(c));
          } else if (a.kind === 'dynamic') {
            collectClassesFromExprInto(a.expr, tw);
          }
        }
      }
      node.children.forEach(visitForHints);
    } else if (node.k === 'fragment') {
      node.children.forEach(visitForHints);
    } else if (node.k === 'if') {
      node.branches.forEach(b => visitForHints(b.node));
      if (node.elseNode) visitForHints(node.elseNode);
    } else if (node.k === 'each') {
      visitForHints(node.node);
    }
  };
  nodes.forEach(visitForHints);
  return { nodes, script, tailwindHints: [...tw] };
}
