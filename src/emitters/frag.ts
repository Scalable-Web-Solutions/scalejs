// emitters/frag.ts
import { Writer } from "../codegen/writer.js";
import type { IRNode } from "../compiler/util/types.js";
import { emitEach } from "./each.js";
import { emitElem } from "./elem.js";
import { emitIf } from "./if.js";
import { emitText } from "./text.js";

export function emitNode(
  w: Writer,
  node: IRNode,
  id: number | string,
  bits: Map<string, number>,
  localsRef: string = 'null',
  ctxRef: string = 'ctx',
  ns: 'html' | 'svg' = 'html'
): string {
  switch (node.k) {
    case 'staticText':
    case 'text':
      // text doesn’t change ns behavior, but we pass it for consistency
      return emitText(w, node as any, id as number, bits, localsRef, ns);

    case 'elem':
      // elem decides whether to flip ns (svg/foreignObject) and passes to its children
      return emitElem(w, node as any, id as number, bits, localsRef, ctxRef, ns);

    case 'if':
      // branches must preserve the current ns
      return emitIf(w, node as any, id as number, bits, localsRef, ctxRef, ns);

    case 'each':
      // loop body must preserve the current ns
      return emitEach(w, node as any, id as number, bits, localsRef, ctxRef, ns);

    case 'fragment': {
      const name = `block_frag_${id}`;
      const kids = (node as any).children.map((c: any, i: number) =>
        // IMPORTANT: thread ns through fragment children as well
        emitNode(w, c, `${id}_${i}`, bits, localsRef, ctxRef, ns)
      );
      w.emit(`
function ${name}(locals, ${ctxRef}){
  const kids = [ ${kids.join(', ')} ];
  let anch;
  return {
    m({parent, anchor}){
      anch = comment('frag');
      insert(parent, anch, anchor);
      const p = anch.parentNode;
      for (const k of kids) k.m({ parent: p, anchor: anch });
    },
    p(dirty,s){ for (const k of kids) k.p(dirty,s); },
    d(){ for (const k of kids) k.d(); detach(anch); }
  };
}`);
      return `${name}(${localsRef}, ${ctxRef})`;
    }
  }
}
