export function collectClassesInto(classAttr: string, targetSet: Set<string>) {
  classAttr.split(/\s+/).filter(Boolean).forEach(c => targetSet.add(c));
}

// Pull potential class names from expressions to feed Tailwind JIT.
// Heuristics: quoted strings, static parts of template literals, simple arrays/objects.
export function collectClassesFromExprInto(expr: string, targetSet: Set<string>) {
  // quoted strings
  for (const m of expr.matchAll(/(['"])(.*?)\1/g)) {
    collectClassesInto(m[2], targetSet);
  }
  // template literals: only static parts
  for (const m of expr.matchAll(/`([^`]*)`/g)) {
    m[1].split(/\$\{[^}]+\}/g).forEach(frag => collectClassesInto(frag, targetSet));
  }
  // arrays/objects: bare words inside
  for (const m of expr.matchAll(/\[(.*?)\]|\{([^}]+)\}/g)) {
    collectClassesInto((m[1] || m[2] || "").replace(/[:,]/g, " "), targetSet);
  }
}