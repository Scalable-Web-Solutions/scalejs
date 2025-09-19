// lexer.ts
import * as types from './types.js';

/* -------------------- Diagnostics -------------------- */
class LexError extends Error {
  constructor(
    message: string,
    public line: number,
    public col: number,
    public codeFrame?: string
  ){
    super(message);
    this.name = 'LexError';
  }
}

function makeCodeFrame(src: string, line: number, col: number, span = 1): string {
  const lines = src.split(/\r\n|\r|\n/);
  const L = Math.max(1, Math.min(line, lines.length));
  const text = lines[L - 1] ?? '';
  const underline = ' '.repeat(Math.max(0, col - 1)) + '^'.repeat(Math.max(1, span));
  return `${L} | ${text}\n    ${underline}`;
}

/* -------------------- Tokenizer -------------------- */
export function tokenize(input: string): types.Token[] {
  const out: types.Token[] = [];

  let pos = 0, line = 1, col = 1;
  let inTag = false; // are we inside < ... > ?

  // Snapshot current source position (for token starts / errors)
  const snap = () => ({ pos, line, col });

  // Centralized error thrower, always anchored to a known position
  function lexError(msg: string, anchor = snap(), span = 1): never {
    const frame = makeCodeFrame(input, anchor.line, anchor.col, span);
    throw new LexError(`${msg} (at ${anchor.line}:${anchor.col})`, anchor.line, anchor.col, frame);
  }

  function push(kind: types.TokKind, value: string | undefined, startPos: number, startLine: number, startCol: number) {
    out.push({ kind, value, pos: startPos, line: startLine, col: startCol });
  }

  function advance(): string | undefined {
    if (pos >= input.length) return undefined;
    const ch = input[pos++];
    if (ch === '\n') { line++; col = 1; return ch; }
    if (ch === '\r') {
      // Support \r\n or lone \r
      if (input[pos] === '\n') { pos++; line++; col = 1; return '\n'; }
      line++; col = 1; return '\n';
    }
    col++;
    return ch;
  }

  function readWhile(pred: (c: string) => boolean): string {
    const start = pos;
    while (pos < input.length && pred(input[pos]!)) advance();
    return input.slice(start, pos);
  }

  // Reads a JS template literal (with nested ${…}), returns raw including backticks
  function readTemplateLiteral(): { raw: string; start: {pos:number,line:number,col:number} } {
    const start = snap(); // points at opening `
    advance();            // consume initial `
    let depth = 0;
    while (pos < input.length) {
      const c = input[pos];

      if (c === '\\') { advance(); advance(); continue; } // skip escaped char
      if (c === '`' && depth === 0) { advance(); break; }

      if (c === '$' && input[pos + 1] === '{') { advance(); advance(); depth++; continue; }
      if (c === '}' && depth > 0) { advance(); depth--; continue; }

      advance();
    }
    if (pos > input.length) {
      lexError('Unterminated template literal', start);
    }
    const raw = input.slice(start.pos, pos);
    return { raw, start };
  }

  while (pos < input.length) {
    const ch = input[pos];

    // ---------------- Template literal anywhere ----------------
    if (ch === '`') {
      const { raw, start } = readTemplateLiteral();
      push('STRING', raw, start.pos, start.line, start.col);
      continue;
    }

    // ---------------- { ... } (blocks + mustaches) ----------------
    if (ch === '{') {
      const open = snap();
      advance(); // '{'
      push('LBRACE', '{', open.pos, open.line, open.col);

      // skip optional whitespace
      while (pos < input.length && /\s/.test(input[pos]!)) advance();

      const rest = input.slice(pos);

      function emitClosingBrace(afterWhat: string) {
        while (pos < input.length && /\s/.test(input[pos]!)) advance();
        if (input[pos] !== '}') lexError(`Expected '}' after ${afterWhat}`, open);
        const close = snap();
        advance(); // '}'
        push('RBRACE', '}', close.pos, close.line, close.col);
      }

      if (rest.startsWith('#if'))      { const s = snap(); pos += 3; col += 3; push('HASH_IF', '#if', s.pos, s.line, s.col); continue; }
      if (rest.startsWith('#each'))    { const s = snap(); pos += 5; col += 5; push('HASH_EACH', '#each', s.pos, s.line, s.col); continue; }
      if (rest.startsWith(':else if')) { const s = snap(); pos += 8; col += 8; push('ELSE_IF', ':else if', s.pos, s.line, s.col); emitClosingBrace(':else if'); continue; }
      if (rest.startsWith(':else'))    { const s = snap(); pos += 5; col += 5; push('ELSE', ':else', s.pos, s.line, s.col); emitClosingBrace(':else'); continue; }
      if (rest.startsWith('/if'))      { const s = snap(); pos += 3; col += 3; push('END_IF', '/if', s.pos, s.line, s.col); emitClosingBrace('/if'); continue; }
      if (rest.startsWith('/each'))    { const s = snap(); pos += 5; col += 5; push('END_EACH', '/each', s.pos, s.line, s.col); emitClosingBrace('/each'); continue; }

      // plain mustache body until next }
      const bodyStart = snap();
      while (pos < input.length && input[pos] !== '}') advance();
      const body = input.slice(bodyStart.pos, pos);
      if (body) push('TEXT', body, bodyStart.pos, bodyStart.line, bodyStart.col);
      if (input[pos] !== '}') lexError('Unterminated mustache', open);
      const close = snap();
      advance(); // '}'
      push('RBRACE', '}', close.pos, close.line, close.col);
      continue;
    }

    if (ch === '}') {
      const s = snap();
      advance();
      push('RBRACE', '}', s.pos, s.line, s.col);
      continue;
    }

    // ---------------- Tag delimiters ----------------
    if (ch === '<') {
      const s = snap();
      advance();
      push('LT', '<', s.pos, s.line, s.col);
      inTag = true;
      continue;
    }
    if (ch === '>') {
      const s = snap();
      advance();
      push('GT', '>', s.pos, s.line, s.col);
      inTag = false;
      continue;
    }

    // ---------------- TAG context ----------------
    if (inTag) {
      // skip whitespace INSIDE tag without producing TEXT
      if (/\s/.test(ch)) { advance(); continue; }

      if (ch === '/') { const s = snap(); advance(); push('SLASH', '/', s.pos, s.line, s.col); continue; }
      if (ch === '=') { const s = snap(); advance(); push('EQUALS', '=', s.pos, s.line, s.col); continue; }
      if (ch === '@') { const s = snap(); advance(); push('AT', '@', s.pos, s.line, s.col); continue; }

      if (ch === '"' || ch === "'") {
        const q = ch;
        const open = snap();
        advance(); // opening quote
        while (pos < input.length && input[pos] !== q) {
          if (input[pos] === '\\' && pos + 1 < input.length) { advance(); }
          const c = advance();
          // advance() handles newlines & col
          if (c === undefined) break;
        }
        if (pos >= input.length) lexError('Unterminated string literal in tag', open);
        advance(); // closing quote
        const raw = input.slice(open.pos, pos);
        push('STRING', raw, open.pos, open.line, open.col);
        continue;
      }

      // IDENT for tag/attr names: first char A-Za-z _ : @
      if (/[A-Za-z_:@]/.test(ch)) {
        const s = snap();
        readWhile(c => /[A-Za-z0-9_.:\-]/.test(c));
        push('IDENT', input.slice(s.pos, pos), s.pos, s.line, s.col);
        continue;
      }

      // Numbers (for unquoted values like width=100)
      if (/[0-9]/.test(ch)) {
        const s = snap();
        readWhile(c => /[0-9._-]/.test(c));
        push('NUMBER', input.slice(s.pos, pos), s.pos, s.line, s.col);
        continue;
      }

      // Braces in TAG (for attr values like class={expr})
      if (ch === '{') { const s = snap(); advance(); push('LBRACE', '{', s.pos, s.line, s.col); continue; }
      if (ch === '}') { const s = snap(); advance(); push('RBRACE', '}', s.pos, s.line, s.col); continue; }

      // Any other single char in a tag: skip it (don’t emit TEXT)
      advance();
      continue;
    }

    // ---------------- DATA context (outside tags) ----------------
    // Preserve spaces/newlines by *not* emitting TEXT for pure whitespace; just move forward
    if (/\s/.test(ch)) {
      const s = snap();
      const ws = readWhile(c => /\s/.test(c));
      push('TEXT', ws, s.pos, s.line, s.col);   // ← keep it (HTML will collapse visually)
      continue;
    }

    if (ch === '/') { const s = snap(); advance(); push('SLASH', '/', s.pos, s.line, s.col); continue; }
    if (ch === '=') { const s = snap(); advance(); push('EQUALS', '=', s.pos, s.line, s.col); continue; }
    if (ch === '@') { const s = snap(); advance(); push('AT', '@', s.pos, s.line, s.col); continue; }

    if (ch === '"' || ch === "'") {
      const q = ch;
      const open = snap();
      advance(); // opening quote
      while (pos < input.length && input[pos] !== q) {
        if (input[pos] === '\\' && pos + 1 < input.length) { advance(); }
        const c = advance();
        if (c === undefined) break;
      }
      if (pos >= input.length) lexError('Unterminated string literal', open);
      advance(); // closing quote
      push('STRING', input.slice(open.pos, pos), open.pos, open.line, open.col);
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const s = snap();
      readWhile(c => /[0-9._-]/.test(c));
      push('NUMBER', input.slice(s.pos, pos), s.pos, s.line, s.col);
      continue;
    }

    // Plain TEXT until a special char starts
    const s = snap();
    readWhile(c => !['{','}','<','>','/','=','@','`'].includes(c));
    push('TEXT', input.slice(s.pos, pos), s.pos, s.line, s.col);
  }

  return out;
}
