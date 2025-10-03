// emitters/each.ts
import { maskOf } from "../codegen/bitmask.js";
import { Writer } from "../codegen/writer.js";
import type { IREach } from "../compiler/util/types.js";
import { emitNode } from "./frag.js";

export function emitEach(
  w: Writer,
  n: IREach,
  id: number,
  bits: Map<string, number>,
  localsRef: string = 'null',
  ctxRef: string = 'ctx',
  ns: 'html' | 'svg' = 'html'
) {
  const mask = maskOf(n.listStateDeps, bits);
  const getList = `get_list_${id}`;

  const stateDecl = n.listStateDeps.length ? `const { ${n.listStateDeps.join(', ')} } = s;` : '';
  w.emit(`function ${getList}(s){ ${stateDecl} return ((${n.listExpr})) || []; }`);

  const childFactory = `mk_item_${id}`;
  w.emit(`
function ${childFactory}(locals, ${ctxRef}){
  return ${emitNode(w, n.node, `${id}_child`, bits, 'locals', ctxRef, ns)};
}`);

  const name = `block_each_${id}`;
  w.emit(`
function ${name}(${ctxRef}){
  let nodes = []; let items = []; let anch;
  return {
    m({parent, anchor}) {
      anch = comment('each');
      insert(parent, anch, anchor);
      items = ${getList}(__state);
      const p = anch.parentNode;
      for (let i = 0; i < items.length; i++){
        const locals = { ${n.item}: items[i]${n.index ? `, ${n.index}: i` : ''} };
        const b = ${childFactory}(locals, ${ctxRef});
        nodes.push(b);
        b.m({ parent: p, anchor: anch });
      }
    },
    p(dirty, s){
      if (!(dirty & ${mask})) {
        for (const b of nodes) b.p(dirty, s);
        return;
      }
      for (const b of nodes) b.d();
      nodes = [];
      items = ${getList}(s);
      const p = anch.parentNode;
      for (let i = 0; i < items.length; i++){
        const locals = { ${n.item}: items[i]${n.index ? `, ${n.index}: i` : ''} };
        const b = ${childFactory}(locals, ${ctxRef});
        nodes.push(b);
        b.m({ parent: p, anchor: anch });
      }
    },
    d(){ for (const b of nodes) b.d(); detach(anch); }
  };
}`);
  return `${name}(${ctxRef})`;
}
