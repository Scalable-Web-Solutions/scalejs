import type { IRNode } from "../util/types.js";

export function wrapChildren(kids: IRNode[]): IRNode {
  return kids.length === 1 ? kids[0] : ({ k: "fragment", children: coalesceStatics(kids) } as IRNode);
}

export function coalesceStatics(kids: (IRNode | null)[]): IRNode[] {
  const out: IRNode[] = [];
  for (const k of kids) {
    if (!k) continue;
    const last = out[out.length - 1];
    if (last && last.k === "staticText" && k.k === "staticText") {
      (last as any).value += (k as any).value;
    } else {
      out.push(k);
    }
  }
  return out;
}