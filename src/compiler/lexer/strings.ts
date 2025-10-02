// src/lexer/strings.ts

export interface Pos {
    pos: number;
    line: number;
    col: number;
  }
  
  export interface StringCtx {
    /** Lookahead. `peek(0)` or `peek()` = current char. */
    peek: (n?: number) => string | undefined;
    /** Consume one char; returns it or undefined at EOF. */
    advance: () => string | undefined;
    /** Snapshot current position. */
    snap: () => Pos;
    /** Throw a formatted lexing error (never returns). */
    lexError: (msg: string, anchor?: Pos, span?: number) => never;
  }
  
  /**
   * Bind string readers to your host lexer helpers without refactoring the rest.
   * Usage in lexer.ts:
   *   const { readEscape, readQuotedString, readTemplateLiteral } =
   *     makeStrings({ peek, advance, snap, lexError });
   */
  export function makeStrings(ctx: StringCtx) {
    const { peek, advance, snap, lexError } = ctx;
  
    // Small helper: advance or throw with a nice message
    function mustAdvance(msg: string, anchor: Pos): string {
      const ch = advance();
      if (ch === undefined) lexError(msg, anchor);
      return ch;
    }

    function readEscape(): string {
      const start = snap();

      // In your original code, you keep the backslash + the escaped char(s) in 'raw'.
      // First char after '\' (e.g., 'n' or 'u'):
      const escLead = advance();
      if (escLead === undefined) lexError("Unexpected end of input after \\", start);
  
      const nxt = peek();
      if (nxt === undefined) lexError("Unterminated escape sequence", start);
  
      // Simple escapes: \n \r \t \" \' \`
      if ('nrt"\'`'.includes(nxt)) {
        const adv2 = mustAdvance("Unterminated escape sequence after \\", start);
        return escLead + adv2; // e.g., '\' + 'n'
      }
  
      // Unicode: \uXXXX or \u{...}
      if (nxt === "u") {
        let raw = escLead + mustAdvance("Expected 'u' after \\", start); // now raw == '\u'
        const afterU = peek();
  
        // \u{...}
        if (afterU === "{") {
          raw += mustAdvance("Expected '{' after \\u", start); // add '{'
          let hex = "";
          // Read hex digits until '}'
          // (We don't convert; we just preserve raw like your TS)
          for (;;) {
            const c = peek();
            if (c === undefined) lexError("Unterminated Unicode escape", start);
            if (c === "}") break;
            if (!/^[0-9a-fA-F]$/.test(c)) lexError("Bad Unicode codepoint", start);
            hex += mustAdvance("Expected hex digit in Unicode escape", start);
          }
          raw += hex + mustAdvance("Unterminated Unicode escape", start); // consume '}'
          return raw; // e.g., '\u{1F600}'
        }
  
        // \uXXXX (exactly 4 hex)
        let hex4 = "";
        for (let i = 0; i < 4; i++) {
          const h = peek();
          if (!h || !/^[0-9a-fA-F]$/.test(h)) lexError("Bad Unicode escape", start);
          hex4 += mustAdvance("Expected hex digit in Unicode escape", start);
        }
        raw += hex4;
        return raw; // e.g., '\u0041'
      }
  
      lexError("Unknown escape sequence", start);
    }
  
    function readQuotedString(q: string): { raw: string; start: Pos } {
      const start = snap();
      mustAdvance("Expected opening quote", start); // consume opening quote
      let raw = q;
  
      for (;;) {
        const c = peek();
        if (c === "\\") {
          raw += readEscape();
          continue;
        }
        if (c === q) {
          raw += mustAdvance("Expected closing quote", start);
          break;
        }
        if (c === undefined) lexError("Unterminated string literal", start);
        raw += mustAdvance("Expected string character", start);
      }
  
      if (raw[raw.length - 1] !== q) lexError("Unterminated string literal", start);
      return { raw, start };
    }
  
    function readTemplateLiteral(): { raw: string; start: Pos } {
      const start = snap();
      mustAdvance("Expected opening backtick", start); // consumed `
      let raw = "`";
      let interpolationDepth = 0;
  
      for (;;) {
        const c = peek();
  
        if (c === "\\") {
          raw += readEscape();
          continue;
        }
        if (c === "`" && interpolationDepth === 0) {
          raw += mustAdvance("Expected closing backtick", start);
          break;
        }
        if (c === "$" && peek(1) === "{") {
          raw += mustAdvance("Expected '$' in template", start);
          raw += mustAdvance("Expected '{' in template interpolation", start);
          interpolationDepth++;
          continue;
        }
        if (c === "}" && interpolationDepth > 0) {
          raw += mustAdvance("Expected '}' to close interpolation", start);
          interpolationDepth--;
          continue;
        }
        if (c === "{" && interpolationDepth > 0) {
          raw += mustAdvance("Expected '{' in nested interpolation", start);
          interpolationDepth++;
          continue;
        }
        if (c === undefined) lexError("Unterminated template literal", start);
        raw += mustAdvance("Expected template character", start);
      }
  
      if (raw[raw.length - 1] !== "`") {
        lexError("Unterminated template literal - missing closing backtick", start);
      }
      if (interpolationDepth !== 0) {
        lexError("Unterminated template literal interpolation", start);
      }
      return { raw, start };
    }
  
    return { readEscape, readQuotedString, readTemplateLiteral };
  }
  