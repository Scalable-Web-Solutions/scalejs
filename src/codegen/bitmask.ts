import { Derived, Prop } from "../compiler/util/types.js";

// codegen/bitmask.ts
export function buildBitMap(props: Prop[], derived: Derived[]) {
  let i = 0; const map = new Map<string, number>();
  for (const p of props) map.set(p.name, 1 << i++);
  for (const d of derived) map.set(d.name, 1 << i++);
  return map; // name -> bit
}

export function buildBitMapFromNames(names: string[]): Map<string, number> {
  const m = new Map<string, number>();
  names.forEach((n, i) => m.set(n, 1 << i));
  return m;
}


export function maskOf(names: string[], bits: Map<string, number>) {
  let m = 0; for (const n of names) m |= bits.get(n) ?? 0; return m;
}