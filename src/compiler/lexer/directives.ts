import type { TokKind } from "./tokens.js";
import { State } from "./state.js";

export function matchBlockKeyword(st: State): { kind: TokKind; kw: string } | null {
  const rest = st.src.slice(st.pos);
  const table: Array<[string, TokKind]> = [
    ["#if", "HASH_IF"], ["#each", "HASH_EACH"],
    [":else if", "ELSE_IF"], [":else", "ELSE"],
    ["/if", "END_IF"], ["/each", "END_EACH"]
  ];
  for (const [kw, kind] of table) {
    if (rest.startsWith(kw)) {
      const next = rest[kw.length];
      if (next && /[A-Za-z0-9_]/.test(next)) continue; // word boundary
      // consume kw + trailing spaces
      for (let i = 0; i < kw.length; i++) st.advance();
      while (/\s/.test(st.peek() ?? "")) st.advance();
      return { kind, kw };
    }
  }
  return null;
}

export function readExpressionBody(st: State, src: string): string {
  let body = "";
  let depth = 0;
  while (st.pos < st.codepoints.length) {
    const c = st.peek();
    if (c === "{") { depth++; body += st.advance(); continue; }
    if (c === "}") { if (depth === 0) break; depth--; body += st.advance(); continue; }
    if (c === "`") { // delegate to strings.ts if you want correctness
      // import on top: import { readTemplateLiteral } from "./strings";
      const { raw } = require("./strings").readTemplateLiteral(st);
      body += raw; continue;
    }
    if (c === '"' || c === "'") {
      const { raw } = require("./strings").readQuotedString(st, c);
      body += raw; continue;
    }
    if (c === "\\") {
      body += require("./strings").readEscape(st); continue;
    }
    body += st.advance();
  }
  return body;
}