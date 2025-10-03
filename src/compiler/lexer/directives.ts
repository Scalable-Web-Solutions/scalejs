// src/lexer/directives.ts
import type { TokKind } from "./tokens.js";
import { State } from "./state.js";

export type StringReaders = {
  readTemplateLiteral: () => { raw: string; start: { pos: number; line: number; col: number } };
  readQuotedString: (q: string) => { raw: string; start: { pos: number; line: number; col: number } };
  readEscape: () => string;
};

export function matchBlockKeyword(st: State): { kind: TokKind; kw: string } | null {
  const rest = st.src.slice(st.pos);
  const table: Array<[string, TokKind]> = [
    ["#if", "HASH_IF"],
    ["#each", "HASH_EACH"],
    [":else if", "ELSE_IF"],
    [":else", "ELSE"],
    ["/if", "END_IF"],
    ["/each", "END_EACH"],
  ];
  for (const [kw, kind] of table) {
    if (rest.startsWith(kw)) {
      const next = rest[kw.length];
      if (next && /[A-Za-z0-9_]/.test(next)) continue; // word boundary
      for (let i = 0; i < kw.length; i++) st.advance();
      while (/\s/.test(st.peek() ?? "")) st.advance();
      return { kind, kw };
    }
  }
  return null;
}

export function readExpressionBody(
  st: State,
  _src: string, // kept for signature parity if you used it in errors
  strings: StringReaders
): string {
  let body = "";
  let depth = 0;

  while (st.pos < st.codepoints.length) {
    const c = st.peek();

    if (c === "{") { depth++; body += st.advance(); continue; }
    if (c === "}") { if (depth === 0) break; depth--; body += st.advance(); continue; }

    if (c === "`") {
      const { raw } = strings.readTemplateLiteral();
      body += raw; continue;
    }
    if (c === '"' || c === "'") {
      const { raw } = strings.readQuotedString(c);
      body += raw; continue;
    }
    if (c === "\\") {
      body += strings.readEscape(); continue;
    }

    body += st.advance();
  }
  return body;
}