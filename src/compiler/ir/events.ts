const braceExpr = /^\{(.+)\}$/s;

export function normEvent(name: string): string | null {
  if (name.startsWith("@")) return name.slice(1);
  if (name.startsWith("on:")) return name.slice(3);
  return null;
}

// Extract expression for dynamic attributes.
// - {expr}           -> "expr"
// - `\${foo}`        -> "foo"
// - other templates  -> the original template string (leave as-is)
export function getDynamicAttrExpr(a: any): string | null {
  if (typeof a?.value === "string") {
    const braceMatch = a.value.match(braceExpr);
    if (braceMatch) {
      const expr = braceMatch[1].trim();
      if (expr) return expr;
    }
    if (a.value.startsWith("`") && a.value.endsWith("`")) {
      const inner = a.value.slice(1, -1);
      const match = inner.match(/^\$\{(.+)\}$/);
      if (match) return match[1].trim(); // single interpolation
      return a.value; // complex template: preserve full template
    }
  }
  if (a && typeof a === "object" && "expr" in a && typeof a.expr === "string") {
    return a.expr.trim();
  }
  return null;
}