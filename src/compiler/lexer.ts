// lexer.ts
import * as types from "./types.js";

/* -------------------- Diagnostics -------------------- */
class LexError extends Error {
  constructor(
    message: string,
    public line: number,
    public col: number,
    public codeFrame?: string
  ) {
    super(message);
    this.name = "LexError";
  }
}

function makeCodeFrame(
  src: string,
  line: number,
  col: number,
  span = 1
): string {
  const lines = src.split(/\r\n|\r|\n/);
  const L = Math.max(1, Math.min(line, lines.length));
  const text = lines[L - 1] ?? "";
  const underline =
    " ".repeat(Math.max(0, col - 1)) + "^".repeat(Math.max(1, span));
  return `${L} | ${text}\n ${underline}`;
}

/* -------------------- Lexer -------------------- */
export function tokenize(input: string): types.Token[] {
  const out: types.Token[] = [];
  let pos = 0,
    charPos = 0,
    line = 1,
    col = 1;
  const tagStack: number[] = [];
  let braceDepth = 0; // Track nesting for expressions
  const codepoints = Array.from(input);

  const snap = () => ({ pos: charPos, line, col });

  function push(
    kind: types.TokKind,
    value: string | undefined,
    startPos: number,
    startLine: number,
    startCol: number
  ) {
    out.push({ kind, value, pos: startPos, line: startLine, col: startCol });
  }

  function lexError(msg: string, anchor = snap(), span = 1): never {
    const frame = makeCodeFrame(input, anchor.line, anchor.col, span);
    throw new LexError(
      `${msg} (at ${anchor.line}:${anchor.col})`,
      anchor.line,
      anchor.col,
      frame
    );
  }

  function advance(): string | undefined {
    if (pos >= codepoints.length) return undefined;
    const ch = codepoints[pos++];
    charPos++;
    if (ch === "\n") {
      line++;
      col = 1;
      return ch;
    }
    if (ch === "\r") {
      if (codepoints[pos] === "\n") {
        pos++;
        charPos++;
        line++;
        col = 1;
        return "\n";
      }
      line++;
      col = 1;
      return "\n";
    }
    col += 1;
    return ch;
  }

  function peek(n = 0): string | undefined {
    return codepoints[pos + n];
  }

  function readWhile(pred: (c: string) => boolean): string {
    const start = pos;
    while (pos < codepoints.length && pred(codepoints[pos]!)) advance();
    return codepoints.slice(start, pos).join("");
  }

  function readEscape(): string {
    const start = snap();
    const escape = advance();
    if (escape === undefined) lexError("Unexpected end of input after \\", start);

    const next = peek();
    if (next === undefined) lexError("Unterminated escape sequence", start);

    if ('nrt"\'`'.includes(next)) {
      const adv = advance();
      if (adv === undefined)
        lexError("Unterminated escape sequence after \\", start);
      return escape + adv;
    }
    if (next === "u") {
      let uStr = escape + advance(); // 'u'
      const afterU = peek();
      if (afterU === "{") {
        uStr += advance(); // '{'
        let hex = "";
        let ch;
        while ((ch = peek()) !== undefined && ch !== "}") hex += advance();
        if (peek() !== "}") lexError("Unterminated Unicode escape", start);
        uStr += hex + advance(); // '}'
        if (!/^[0-9a-fA-F]+$/.test(hex)) lexError("Bad Unicode codepoint", start);
        return uStr;
      } else {
        let hex = "";
        for (let i = 0; i < 4; ++i) {
          const h = peek();
          if (!h || !/[0-9a-fA-F]/.test(h))
            lexError("Bad Unicode escape", start);
          hex += advance();
        }
        uStr += hex;
        return uStr;
      }
    }
    lexError("Unknown escape sequence", start);
  }

  function readQuotedString(q: string): {
    raw: string;
    start: { pos: number; line: number; col: number };
  } {
    const start = snap();
    advance(); // opening quote
    let raw = q;
    while (pos < codepoints.length) {
      const c = peek();
      if (c === "\\") {
        raw += readEscape();
        continue;
      }
      if (c === q) {
        raw += advance();
        break;
      }
      if (c === undefined) lexError("Unterminated string literal", start);
      raw += advance();
    }
    if (raw[raw.length - 1] !== q) lexError("Unterminated string literal", start);
    return { raw, start };
  }

  // --- in lexer.ts ---
  function readTemplateLiteral(): {
    raw: string;
    start: { pos: number; line: number; col: number };
  } {
    const start = snap();
    advance(); // consumed the opening `
    let interpolationDepth = 0;
    let raw = "`"; // keep the opening backtick

    while (pos < codepoints.length) {
      const c = peek();

      if (c === "\\") {
        raw += readEscape();
        continue;
      }
      if (c === "`" && interpolationDepth === 0) {
        raw += advance();
        break;
      }
      if (c === "$" && peek(1) === "{") {
        raw += advance();
        raw += advance();
        interpolationDepth++;
        continue;
      }
      if (c === "}" && interpolationDepth > 0) {
        raw += advance();
        interpolationDepth--;
        continue;
      }
      if (c === "{" && interpolationDepth > 0) {
        raw += advance();
        interpolationDepth++;
        continue;
      }
      if (c === undefined) lexError("Unterminated template literal", start);
      raw += advance();
    }

    if (raw[raw.length - 1] !== "`") {
      lexError(
        "Unterminated template literal - missing closing backtick",
        start
      );
    }
    if (interpolationDepth !== 0) {
      lexError("Unterminated template literal interpolation", start);
    }
    return { raw, start };
  }

  function isLineStartOrOnlyWhitespaceBefore(): boolean {
    // Walk backwards to previous newline and ensure only spaces/tabs
    for (let i = pos - 1; i >= 0; --i) {
      const c = codepoints[i];
      if (c === "\n" || c === "\r") return true;
      if (c !== " " && c !== "\t") return false;
    }
    return true; // start of file
  }
  
  function readUntilEOLRespectingQuotesAndTemplates(): string {
    // Collect until end-of-line, but honor quotes and template literals like your expression reader
    let buf = "";
    while (pos < codepoints.length) {
      const c = peek();
      if (c === "\n" || c === "\r" || c === undefined) break;
  
      if (c === "\\") { buf += readEscape(); continue; }
  
      if (c === '"' || c === "'") {
        const { raw } = readQuotedString(c);
        buf += raw; continue;
      }
      if (c === "`") {
        const { raw } = readTemplateLiteral();
        buf += raw; continue;
      }
  
      buf += advance();
    }
    return buf;
  }
  
  function matchAtDirective(): { kind: types.TokKind; kw: string } | null {
    // We’re at '@' already. Look ahead for keywords with word boundary.
    const keys: Array<[string, types.TokKind]> = [
      ["if",        "AT_IF"],
      ["elseif",    "AT_ELSEIF"],
      ["else",      "AT_ELSE"],
      ["endif",     "AT_ENDIF"],
      ["foreach",   "AT_FOREACH"],
      ["endforeach","AT_ENDFOREACH"],
    ];
  
    for (const [kw, kind] of keys) {
      let ok = true;
      for (let i = 0; i < kw.length; i++) {
        if (peek(1 + i) !== kw[i]) { ok = false; break; }
      }
      if (!ok) continue;
  
      const next = peek(1 + kw.length);
      // require word boundary (end or non-identifier)
      if (next && /[A-Za-z0-9_]/.test(next)) continue;
      return { kind, kw };
    }
    return null;
  }
  

  function matchKeyword(keywords: string[]): string | undefined {
    for (const kw of keywords) {
      let matched = true;
      for (let i = 0; i < kw.length; ++i) {
        if (peek(i) !== kw[i]) {
          matched = false;
          break;
        }
      }
      if (!matched) continue;

      // Ensure next char does not continue an identifier
      const nextChar = peek(kw.length);
      if (nextChar && /[A-Za-z0-9_]/.test(nextChar)) continue;

      // Consume keyword and trailing whitespace
      let spaces = 0;
      for (
        let j = kw.length;
        typeof peek(j) === "string" && /\s/.test(peek(j) as string);
        ++j
      )
        spaces++;
      for (let i = 0; i < kw.length + spaces; ++i) advance();
      return kw;
    }
    return undefined;
  }

  while (pos < codepoints.length) {
    const ch = peek();

    // Template literal (handled regardless of context; parser decides how to use it)
    if (ch === "`") {
      const { raw, start } = readTemplateLiteral();
      push("STRING", raw, start.pos, start.line, start.col);
      continue;
    }

    // Braces for blocks and expressions (global handling)
    if (ch === "{") {
      const open = snap();
      advance();
      push("LBRACE", "{", open.pos, open.line, open.col);
      braceDepth++;

      // Skip whitespace after opening brace
      readWhile((c) => /\s/.test(c));

      // Block/keyword tags
      const keyword = matchKeyword([
        "#if",
        "#each",
        ":else if",
        ":else",
        "/if",
        "/each",
      ]);
      if (keyword) {
        const s = snap();
        const kind: types.TokKind =
          keyword === "#if"
            ? "HASH_IF"
            : keyword === "#each"
            ? "HASH_EACH"
            : keyword === ":else if"
            ? "ELSE_IF"
            : keyword === ":else"
            ? "ELSE"
            : keyword === "/if"
            ? "END_IF"
            : "END_EACH";
        push(kind, keyword, s.pos, s.line, s.col);

        if (keyword === ":else" || keyword === "/if" || keyword === "/each") {
          // These keywords do not accept expressions; require immediate '}'
          readWhile((c) => /\s/.test(c));
          if (peek() !== "}") lexError(`Expected '}' after ${keyword}`, open);
          const close = snap();
          advance();
          push("RBRACE", "}", close.pos, close.line, close.col);
          braceDepth--;
          continue;
        }
        // For keywords that allow trailing expressions (#if, #each, :else if) fall through
      }

      // Regular { expression } content — read until matching }
      const bodyStart = snap();
      let body = "";
      let localDepth = 0;

      while (pos < codepoints.length) {
        const c = peek();
        if (c === "{") {
          localDepth++;
          body += advance();
          continue;
        }
        if (c === "}") {
          if (localDepth === 0) break;
          localDepth--;
          body += advance();
          continue;
        }
        if (c === "`") {
          const { raw } = readTemplateLiteral();
          body += raw;
          continue;
        }
        if (c === '"' || c === "'") {
          const { raw } = readQuotedString(c);
          body += raw;
          continue;
        }
        if (c === "\\") {
          body += readEscape();
          continue;
        }
        if (c === undefined) lexError("Unterminated expression", open);
        body += advance();
      }

      if (body.trim())
        push("TEXT", body, bodyStart.pos, bodyStart.line, bodyStart.col);

      if (peek() !== "}") lexError("Unterminated expression", open);
      const close = snap();
      advance();
      push("RBRACE", "}", close.pos, close.line, close.col);
      braceDepth--;
      continue;
    }

    if (ch === "}") {
      const s = snap();
      advance();
      push("RBRACE", "}", s.pos, s.line, s.col);
      if (braceDepth > 0) braceDepth--;
      continue;
    }

    // Tag delimiters
    if (ch === "<") {
      const s = snap();
      advance();
      push("LT", "<", s.pos, s.line, s.col);
      tagStack.push(pos - 1);
      continue;
    }

    if (ch === ">") {
      if (tagStack.length === 0)
        lexError('Unmatched ">" without preceding "<"', snap());
      const s = snap();
      advance();
      push("GT", ">", s.pos, s.line, s.col);
      tagStack.pop();
      continue;
    }

    const inTag = tagStack.length > 0;

    // --- In Tag Context ------------------------------------------------------
    if (inTag) {
      if (/\s/.test(ch!)) {
        advance();
        continue;
      }
      if (ch === "/") {
        const s = snap();
        advance();
        push("SLASH", "/", s.pos, s.line, s.col);
        continue;
      }
      if (ch === "=") {
        const s = snap();
        advance();
        push("EQUALS", "=", s.pos, s.line, s.col);
        continue;
      }
      if (ch === "@") {
        const s = snap();
        advance();
        push("AT", "@", s.pos, s.line, s.col);
        continue;
      }

      if (ch === '"' || ch === "'") {
        const { raw, start } = readQuotedString(ch);
        push("STRING", raw, start.pos, start.line, start.col);
        continue;
      }

      if (ch === "`") {
        const { raw, start } = readTemplateLiteral();
        push("STRING", raw, start.pos, start.line, start.col);
        continue;
      }

      // ident for tag/attr names
      if (/[A-Za-z_:@]/.test(ch!)) {
        const s = snap();
        readWhile((c) => /[A-Za-z0-9_.:\-@]/.test(c));
        push("IDENT", codepoints.slice(s.pos, charPos).join(""), s.pos, s.line, s.col);
        continue;
      }

      // number for attrs
      if (/[0-9]/.test(ch!)) {
        const s = snap();
        readWhile((c) => /[0-9._-]/.test(c));
        push("NUMBER", codepoints.slice(s.pos, charPos).join(""), s.pos, s.line, s.col);
        continue;
      }

      // braces in tag (for dynamic attribute values)
      if (ch === "{") {
        const s = snap();
        advance();
        push("LBRACE", "{", s.pos, s.line, s.col);
        braceDepth++;
        continue;
      }
      if (ch === "}") {
        const s = snap();
        advance();
        push("RBRACE", "}", s.pos, s.line, s.col);
        if (braceDepth > 0) braceDepth--;
        continue;
      }

      // Fallback: emit as CHAR token (invalid but keeps the stream moving)
      const s = snap();
      push("CHAR", advance(), s.pos, s.line, s.col);
      continue;
    }

    // --- Data Context (outside tags) -----------------------------------------
    // Emit ONE TEXT token that runs until the next control opener: '<', '{', or '`'
    {
      const s = snap();
      const text = readWhile((c) => c !== "<" && c !== "{" && c !== "`");
      if (text) {
        push("TEXT", text, s.pos, s.line, s.col);
        continue;
      }
      // If we didn't consume anything, we're sitting on a control char handled above.
    }

    // Final guard (should rarely execute): consume a single char to avoid infinite loop
    {
      const s = snap();
      const c = advance();
      if (c !== undefined) push("CHAR", c, s.pos, s.line, s.col);
    }
  }

  return out;
}