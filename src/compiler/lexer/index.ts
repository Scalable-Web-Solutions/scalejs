import { State } from "./state.js";
import { LexError } from "./diagnostics.js";
import type { Token, TokKind } from "./tokens.js";
import * as directives from "./directives.js";
import { makeStrings } from "./strings.js";

export function tokenize(input: string): Token[] {
  const st = new State(input);
  const out: Token[] = [];
  const tagStack: number[] = [];
  let braceDepth = 0;

  const push = (kind: TokKind, value?: string, s = st.snap()) =>
    out.push({ kind, value, pos: s.pos, line: s.line, col: s.col });

  const readers = makeStrings({
    peek: (n?: number) => st.peek(n),
    advance: () => st.advance(),
    snap: () => st.snap(),
    lexError: (msg, anchor, span) => {
      throw new LexError(msg, anchor?.line ?? st.line, anchor?.col ?? st.col, input, span);
    },
  });
  const { readQuotedString, readTemplateLiteral, readEscape } = readers;

  while (st.pos < st.codepoints.length) {
    const ch = st.peek();

    // 1) Template literal
    if (ch === "`") {
      const { raw, start } = readTemplateLiteral();
      push("STRING", raw, start); continue;
    }

    // 2) Braces: directives or generic {expr}
    if (ch === "{") {
      const open = st.snap(); st.advance(); push("LBRACE", "{", open);
      while (/\s/.test(st.peek() ?? "")) st.advance();

      const kw = directives.matchBlockKeyword(st);
      if (kw) {
        push(kw.kind, kw.kw);
        if (kw.kind === "ELSE" || kw.kind === "END_IF" || kw.kind === "END_EACH") {
          while (/\s/.test(st.peek() ?? "")) st.advance();
          if (st.peek() !== "}") throw new LexError(`Expected '}' after ${kw.kw}`, open.line, open.col, input);
          const close = st.snap(); st.advance(); push("RBRACE", "}", close); continue;
        }
        const bodyStart = st.snap();
        const body = directives.readExpressionBody(st, input, readers);
        if (body.trim()) push("TEXT", body, bodyStart);
        if (st.peek() !== "}") throw new LexError("Unterminated expression", open.line, open.col, input);
        const close = st.snap(); st.advance(); push("RBRACE", "}", close);
        continue;
      }

      // generic { expr }
      const bodyStart = st.snap();
      if (readers === undefined) break;
      const body = directives.readExpressionBody(st, input, readers);
      if (body.trim()) push("TEXT", body, bodyStart);
      if (st.peek() !== "}") throw new LexError("Unterminated expression", open.line, open.col, input);
      const close = st.snap(); st.advance(); push("RBRACE", "}", close);
      continue;
    }

    // 3) Tag punct & in-tag logic (compact)
    if (ch === "<") { const s = st.snap(); st.advance(); push("LT", "<", s); tagStack.push(st.pos - 1); continue; }
    if (ch === ">") {
      if (!tagStack.length) throw new LexError(`Unmatched ">"`, st.line, st.col, input);
      const s = st.snap(); st.advance(); push("GT", ">", s); tagStack.pop(); continue;
    }
    const inTag = tagStack.length > 0;
    if (inTag) {
      if (/\s/.test(ch!)) { st.advance(); continue; }
      if (ch === "/") { const s = st.snap(); st.advance(); push("SLASH", "/", s); continue; }
      if (ch === "=") { const s = st.snap(); st.advance(); push("EQUALS", "=", s); continue; }
      if (ch === "@") { const s = st.snap(); st.advance(); push("AT", "@", s); continue; }

      if (ch === '"' || ch === "'") { const { raw, start } = readQuotedString(ch); push("STRING", raw, start); continue; }
      if (ch === "`") { const { raw, start } = readTemplateLiteral(); push("STRING", raw, start); continue; }

      if (/[A-Za-z_:@]/.test(ch!)) {
        const s = st.snap(); const v = st.readWhile(c => /[A-Za-z0-9_.:\-@]/.test(c));
        push("IDENT", v, s); continue;
      }
      if (/[0-9]/.test(ch!)) {
        const s = st.snap(); const v = st.readWhile(c => /[0-9._-]/.test(c));
        push("NUMBER", v, s); continue;
      }

      if (ch === "{") { const s = st.snap(); st.advance(); push("LBRACE", "{", s); braceDepth++; continue; }
      if (ch === "}") { const s = st.snap(); st.advance(); push("RBRACE", "}", s); if (braceDepth > 0) braceDepth--; continue; }

      const s = st.snap(); push("CHAR", st.advance(), s); continue;
    }

    // 4) Data: TEXT until control
    const s = st.snap();
    const text = st.readWhile(c => c !== "<" && c !== "{" && c !== "`");
    if (text) { push("TEXT", text, s); continue; }

    // 5) Final guard
    const g = st.snap(); const c = st.advance(); if (c) push("CHAR", c, g);
  }

  return out;
}