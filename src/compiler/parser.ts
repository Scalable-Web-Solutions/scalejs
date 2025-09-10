export type Prop = { name: string; defaultVal: string | undefined };
export type Derived = { name: string; expr: string; deps: string[] };

export function parseScale(src: string) {
  // 1) Extract blocks
  const mScript = src.match(/<script>([\s\S]*?)<\/script>/i);
  const mStyle  = src.match(/<style>([\s\S]*?)<\/style>/i);

  const script  = mScript?.[1]?.trim() ?? "";
  const style   = mStyle?.[1]?.trim() ?? "";
  const template = src
    .replace(/<script>([\s\S]*?)<\/script>/i, "")
    .replace(/<style>([\s\S]*?)<\/style>/i, "")
    .trim();

  // 2) Props: scan ONLY the script block
  const props: Prop[] = [];
  const propRe = /export\s+let\s+([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*([^;]+))?;/g;
  for (const m of script.matchAll(propRe)) {
    const name = m[1];
    const def  = m[3]?.trim();
    props.push({ name, defaultVal: def });
  }

  // 3) Reactive declarations ($:) — collect in order, with real dep filtering
  const derived: Derived[] = [];
  const stateKeys = new Set<string>(props.map(p => p.name)); // props first

  const rxLine = /^\s*\$:\s*([A-Za-z_]\w*)\s*=\s*(.+?);?\s*$/gm;
  let rxm: RegExpExecArray | null;
  while ((rxm = rxLine.exec(script)) !== null) {
    const name = rxm[1];
    const expr = rxm[2].trim();
    const deps = collectReactiveDeps(expr, stateKeys).filter(d => d !== name);
    derived.push({ name, expr, deps });
    stateKeys.add(name); // allow derived→derived chains for later lines
  }

  // 4) Build the cleaned script for the TS compiler (no $: and no export lets)
  const scriptNoReactive = script.replace(/^\s*\$:.*$/gm, "");
  const scriptClean = scriptNoReactive.replace(propRe, "").trim();

  return { script: scriptClean, style, template, props, derived };
}

/** Keep identifiers in ${…} inside template literals, drop raw text; also drop '...' and "..." */
function collectReactiveDeps(expr: string, allowed: Set<string>): string[] {
  // Remove single/double-quoted strings
  let s = expr
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "")
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, "");

  // Replace a template literal with just the joined ${...} expression bodies
  s = s.replace(/`(?:[^`\\]|\\.|(\$\{[^}]*\}))*`/g, (m) => {
    const parts: string[] = [];
    m.replace(/\$\{([^}]*)\}/g, (_whole, inner) => {
      parts.push(String(inner));
      return "";
    });
    return parts.join(" ");
  });

  // Now collect identifiers and filter to allowed keys
  const out = new Set<string>();
  const re = /\b[A-Za-z_]\w*\b/g;
  const jsGlobals = new Set([
    "true","false","null","undefined","NaN","Infinity",
    "Math","Date","JSON","Number","String","Boolean","Array","Object"
  ]);
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const id = m[0];
    if (!jsGlobals.has(id) && allowed.has(id)) out.add(id);
  }
  return [...out];
}
