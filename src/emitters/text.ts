// emitters/text.ts
import { maskOf } from "../codegen/bitmask.js";
import { Writer } from "../codegen/writer.js";
import type { IRText } from "../compiler/util/types.js";
import { emitNode } from "./frag.js";

// emitters/text.ts
export function emitText(w: Writer, n: IRText, id: number, bits: Map<string, number>, localsRef = 'null', ctxRef = 'ctx') {
  if (n.k === 'staticText') {
    const name = `block_txt_${id}`;
    w.emit(`
function ${name}(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(${JSON.stringify(n.value)}); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}`);
    return `${name}(${localsRef})`;
  }

  const mask = maskOf(n.stateDeps, bits);
  const get = `get_txt_${id}`;
  const stateDecl = n.stateDeps.length ? `const { ${n.stateDeps.join(', ')} } = s;` : '';
  const localDecl = (n.localDeps?.length ? `const { ${n.localDeps.join(', ')} } = locals || {};` : '');
  w.emit(`function ${get}(s,locals){ ${stateDecl} ${localDecl} return (${n.expr}); }`);

  const name = `block_txt_${id}`;
  w.emit(`
function ${name}(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(${get}(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & ${mask}) set_data(t, ${get}(s, locals)); },
    d(){ detach(t); }
  };
}`);
  return `${name}(${localsRef})`;
}
