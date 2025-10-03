// emitters/if.ts
import { Writer } from "../codegen/writer.js";
import type { IRIf } from "../compiler/util/types.js";
import { emitNode } from "./frag.js";
import { maskOf } from "../codegen/bitmask.js";

export function emitIf(
  w: Writer,
  n: IRIf,
  id: number,
  bits: Map<string, number>,
  localsRef: string = 'null',
  ctxRef: string = 'ctx',
  ns: 'html' | 'svg' = 'html'
) {
  // Only re-evaluate selector when these bits are dirty
  const selectorMask = maskOf(
    Array.from(new Set(n.branches.flatMap(b => b.stateDeps || []))),
    bits
  );

  const sel = `select_if_${id}`;
  const selStateDeps = Array.from(new Set(n.branches.flatMap(b => b.stateDeps || [])));
  const selLocalDeps = Array.from(new Set(n.branches.flatMap(b => b.localDeps || [])));
  const stateDecl = selStateDeps.length ? `const { ${selStateDeps.join(', ')} } = s;` : '';
  const localDecl = selLocalDeps.length ? `const { ${selLocalDeps.join(', ')} } = locals || {};` : '';

  w.emit(`function ${sel}(s, locals){ ${stateDecl} ${localDecl} ${n.branches.map((b,i)=>`if(!!(${b.expr})) return 'b${i}';`).join(' ')} return ${n.elseNode ? `'else'` : 'null'}; }`);

  const branches = n.branches.map(
    (b, i) => `'b${i}': ()=>${emitNode(w, b.node, `${id}_${i}`, bits, localsRef, ctxRef, ns)}`
  );
  if (n.elseNode) {
    branches.push(`'else': ()=>${emitNode(w, n.elseNode, `${id}_e`, bits, localsRef, ctxRef, ns)}`);
  }

  const name = `block_if_${id}`;
  w.emit(`
function ${name}(locals, ${ctxRef}){
  let cur = null, key = null, anch;
  const tbl = { ${branches.join(", ")} };
  return {
    m({parent, anchor}) {
      anch = comment('if');
      insert(parent, anch, anchor);
      key = ${sel}(__state, locals);
      cur = key ? tbl[key]() : null;
      const p = anch.parentNode;
      if (cur) cur.m({ parent: p, anchor: anch });
    },
    p(dirty, s){
      if ((dirty & ${selectorMask}) === 0) { cur && cur.p(dirty, s); return; }
      const nk = ${sel}(s, locals);
      if (nk === key) { cur && cur.p(dirty, s); return; }
      if (cur) cur.d();
      key = nk;
      cur = key ? tbl[key]() : null;
      const p = anch.parentNode;
      if (cur) cur.m({ parent: p, anchor: anch });
    },
    d(){ if (cur) cur.d(); detach(anch); }
  };
}`);
  return `${name}(${localsRef}, ${ctxRef})`;
}
