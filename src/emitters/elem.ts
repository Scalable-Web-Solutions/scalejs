// emitters/elem.ts
import { maskOf } from "../codegen/bitmask.js";
import { Writer } from "../codegen/writer.js";
import type { IRElem, IRAttrStatic, IRAttrDynamic } from "../compiler/types.js";
import { emitNode } from "./frag.js";

export function emitElem(
  w: Writer,
  n: IRElem,
  id: number,
  bits: Map<string, number>,
  localsRef: string = 'null',
  ctxRef: string = 'ctx'
) {
  const childExprs = n.children.map((c, i) =>
    emitNode(w, c, `${id}_${i}`, bits, localsRef, ctxRef)
  );

  // Split attrs
  const staticAttrs = n.attrs.filter(a => a.kind === "static") as IRAttrStatic[];
  const dynAttrs = (n.attrs.filter(a => a.kind === "dynamic") as IRAttrDynamic[])
    .map((a, i) => {
      const uid = `${id}_${i}`;
      // NOTE: keep signature matching your maskOf (names, bits)
      const mask = maskOf(a.stateDeps, bits);
      // Emit getter for this dynamic attr
      const get = `get_attr_${uid}`;
      const stateDecl = a.stateDeps.length ? `const { ${a.stateDeps.join(', ')} } = s;` : '';
      const localDecl = a.localDeps?.length ? `const { ${a.localDeps.join(', ')} } = locals || {};` : '';
      w.emit(`function ${get}(s, locals){ ${stateDecl} ${localDecl} return ((${a.expr})); }`);
      return { a, uid, get, mask };
    });

  // Merge static + dynamic class if both exist
  // (remove static class from the static set, route via wrapper getter)
  const staticClassIdx = staticAttrs.findIndex(a => a.name === 'class' || (a as any).name === 'className');
  const dynClassIdx = dynAttrs.findIndex(d => d.a.name === 'class' || d.a.name === 'className');
  if (staticClassIdx !== -1 && dynClassIdx !== -1) {
    const base = staticAttrs[staticClassIdx].value === true ? '' : String(staticAttrs[staticClassIdx].value ?? '').trim();
    const wrapUid = `${id}_cls`;
    const inner = dynAttrs[dynClassIdx].get;
    // Wrapper getter: prepend base static classes
    w.emit(`
function get_attr_${wrapUid}(s, locals){
  const v = ${inner}(s, locals);
  const lhs = ${JSON.stringify(base)};
  if (!lhs) return v ?? '';
  const rhs = v == null ? '' : String(v);
  return rhs ? (lhs + ' ' + rhs) : lhs;
}`);
    // Route dynamic class through wrapper, drop static one
    dynAttrs[dynClassIdx] = { ...dynAttrs[dynClassIdx], uid: wrapUid, get: `get_attr_${wrapUid}` };
    staticAttrs.splice(staticClassIdx, 1);
  }

  // Static attrs → mount once
  const staticLines = staticAttrs
    .map(a => `attr(el, ${JSON.stringify(a.name)}, ${a.value === true ? "true" : JSON.stringify(a.value)});`)
    .join("\n      ");

  // Dynamic attrs → mount initial + patch on mask
  const dynMountLines = dynAttrs
    .map(d => `attr(el, ${JSON.stringify(d.a.name)}, ${d.get}(__state, locals));`)
    .join("\n      ");

  const dynPatchLines = dynAttrs
    .map(d => `if (dirty & ${d.mask}) attr(el, ${JSON.stringify(d.a.name)}, ${d.get}(s, locals));`)
    .join("\n      ");

  // Events
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
      el = element(${JSON.stringify(n.tag)});
      ${staticLines}
      ${dynMountLines}
      ${onLines}
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      ${dynPatchLines}
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}`);
  return `${name}(${localsRef}, ${ctxRef})`;
}
