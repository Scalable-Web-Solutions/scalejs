import { maskOf } from "../codegen/bitmask.js";
import { Writer } from "../codegen/writer.js";
import type { IRElem } from "../compiler/util/types.js";
import { emitNode } from "./frag.js";

// add ns param, default 'html'
// ...imports unchanged...

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
      // Normalize className -> class (optional, but nice to have)
      const nameStr = (a.name === 'className') ? 'class' : a.name;
      const name = JSON.stringify(nameStr);
      const val = a.value === true ? "true" : JSON.stringify(a.value);
      return `attr(el, ${name}, ${val});`;
    })
    .join("\n      ");

  // === Dynamic attrs setup ===
  const dynamicAttrs = n.attrs.filter(a => a.kind === 'dynamic');

  // Emit a getter for each dynamic attr (same as before)
  dynamicAttrs.forEach((a, i) => {
    const get = `get_attr_${id}_${i}`;
    const stateDecl = a.stateDeps.length ? `const { ${a.stateDeps.join(', ')} } = s;` : '';
    const localDecl = (a.localDeps?.length ? `const { ${a.localDeps.join(', ')} } = locals || {};` : '');
    // Define getter before block function
    w.emit(`function ${get}(s, locals){ ${stateDecl} ${localDecl} return ((${a.expr})); }`);
  });

  // NEW: initial set for dynamic attrs during mount
  const dynInitLines = dynamicAttrs.map((a, i) => {
    const nameStr = (a.name === 'className') ? 'class' : a.name;
    return `attr(el, ${JSON.stringify(nameStr)}, get_attr_${id}_${i}(${ctxRef}.state, ${localsRef}));`;
  }).join('\n      ');

  // Updates: respect dirty mask, but also handle local-only deps
  const dynLines = dynamicAttrs.map((a, i) => {
    const nameStr = (a.name === 'className') ? 'class' : a.name;
    const mask = maskOf(a.stateDeps, bits);
    const hasStateMask = mask !== 0;
    const hasLocalDeps = !!(a.localDeps && a.localDeps.length);

    // Condition: state dirty OR (no state deps but has local deps => always re-eval on p())
    let cond: string;
    if (hasStateMask && hasLocalDeps) {
      cond = `(dirty & ${mask}) || /*local deps*/ true`;
    } else if (hasStateMask) {
      cond = `(dirty & ${mask})`;
    } else if (hasLocalDeps) {
      cond = `true`;
    } else {
      // No deps at all => compute once on mount; skip updates
      cond = `false`;
    }

    return `
      if (${cond}) {
        attr(el, ${JSON.stringify(nameStr)}, get_attr_${id}_${i}(state, ${localsRef}));
      }`.trim();
  }).join('\n      ');

  const onLines = n.on.map((o, i) => {
    const m = String(o.handler).trim().match(/^([A-Za-z_]\w*)\s*\((.*)\)\s*$/);
    if (m) {
      const name = m[1];
      const args = m[2].trim();
      const callArgs = args ? `${args}, ev` : `ev`;
      return `
          offs.push(listen(el, ${JSON.stringify(o.evt)}, (ev) => {
            const state = ${ctxRef}.state;
            const localsRef = ${localsRef};
            const fn = ${ctxRef} && ${ctxRef}.${name};
            if (typeof fn === 'function') fn.call(${ctxRef}, ${callArgs});
          }));`;
    } else {
      return `
          offs.push(listen(el, ${JSON.stringify(o.evt)}, (ev) => {
            const state = ${ctxRef}.state;
            const localsRef = ${localsRef};
            (function(){
              ${o.handler}
            }).call(${ctxRef});
          }));`;
    }
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
      // NEW: apply dynamic attrs once on initial mount
      ${dynInitLines}
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      ${dynLines}
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}`);
  return `${name}(${localsRef}, ${ctxRef})`;
}
