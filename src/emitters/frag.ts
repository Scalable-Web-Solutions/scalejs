// emitters/dispatch.ts
import { Writer } from "../codegen/writer.js";
import type { IRNode } from "../compiler/types.js";
import { emitEach } from "./each.js";
import { emitElem } from "./elem.js";
import { emitIf } from "./if.js";
import { emitText } from "./text.js";

export function emitNode(w: Writer, node: IRNode, id: number | string, bits: Map<string, number>, localsRef: string = 'null', ctxRef: string = 'ctx'): string {
  switch (node.k) {
    case 'staticText':
    case 'text':      return emitText(w, node as any, id as number, bits, localsRef);
    case 'elem':      return emitElem(w, node as any, id as number, bits, localsRef, ctxRef);
    case 'if':        return emitIf(w, node as any, id as number, bits, localsRef, ctxRef);
    case 'each':      return emitEach(w, node as any, id as number, bits, localsRef, ctxRef);
    case 'fragment': {
      const name = `block_frag_${id}`;
      const kids = (node as any).children.map((c: any, i: number) =>
        emitNode(w, c, `${id}_${i}`, bits, localsRef, ctxRef)
      );
      w.emit(`
function ${name}(locals, ${ctxRef}){
  const kids = [ ${kids.join(', ')} ];
  let anch;
  return {
    m({parent, anchor}){ anch = comment('frag'); insert(parent, anch, anchor);
      const p = anch.parentNode;
      for (const k of kids) k.m({ parent: p, anchor: anch }); },
    p(dirty,s){ for (const k of kids) k.p(dirty,s); },
    d(){ for (const k of kids) k.d(); detach(anch); }
  };
}`);
      return `${name}(${localsRef}, ${ctxRef})`;
    }
  }
}
