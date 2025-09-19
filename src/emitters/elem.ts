import { maskOf } from "../codegen/bitmask.js";
import { Writer } from "../codegen/writer.js";
import type { IRElem } from "../compiler/types.js";
import { emitNode } from "./frag.js";

// add ns param, default 'html'
export function emitElem(
  w: Writer,
  n: IRElem,
  id: number,
  bits: Map<string,number>,
  localsRef: string = 'null',
  ctxRef: string = 'ctx',
  ns: 'html'|'svg' = 'html'
) {
  const tag = n.tag.toLowerCase();
  const thisNs: 'html'|'svg' =
    ns === 'svg' ? (tag === 'foreignobject' ? 'html' : 'svg')
                 : (tag === 'svg' ? 'svg' : 'html');

  const childExprs = n.children.map((c, i) =>
    emitNode(w, c, `${id}_${i}`, bits, localsRef, ctxRef, thisNs)
  );

  // static attrs
  const staticLines = n.attrs
    .filter(a => a.kind === "static")
    .map(a => {
      const name = JSON.stringify(a.name);
      const val = a.value === true ? "true" : JSON.stringify(a.value);
      return `attr(el, ${name}, ${val});`;
    })
    .join("\n      ");

  // dynamic attrs
  const dynLines = n.attrs
    .filter(a => a.kind === 'dynamic')
    .map((a, i) => {
      const get = `get_attr_${id}_${i}`;
      const mask = maskOf(a.stateDeps, bits);
      const stateDecl = a.stateDeps.length ? `const { ${a.stateDeps.join(', ')} } = s;` : '';
      const localDecl = (a.localDeps?.length ? `const { ${a.localDeps.join(', ')} } = locals || {};` : '');
      w.emit(`function ${get}(s,locals){ ${stateDecl} ${localDecl} return ((${a.expr})); }`);
      return `if (dirty & ${mask}) attr(el, ${JSON.stringify(a.name)}, ${get}(state, ${localsRef}));`;
    }).join('\n      ');

  const onLines = n.on.map(o => {
    const m = String(o.handler).trim().match(/^([A-Za-z_]\w*)\(\)$/);
    const call = m ? `${ctxRef}.${m[1]}()` : `(function(ev){ ${o.handler} }).call(${ctxRef}, ev)`;
    return `offs.push(listen(el, ${JSON.stringify(o.evt)}, (ev)=>{ ${call} }));`;
  }).join('\n      ');

  const name = `block_el_${id}`;
  w.emit(`
function ${name}(locals, ${ctxRef}){
  let el; const kids = [ ${childExprs.join(', ')} ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = ${(thisNs === 'svg') ? `svg_element(${JSON.stringify(n.tag)})` : `element(${JSON.stringify(n.tag)})`};
      ${staticLines}
      ${onLines}
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ ${dynLines} for (const k of kids) k.p(dirty,state); },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}`);
  return `${name}(${localsRef}, ${ctxRef})`;
}
