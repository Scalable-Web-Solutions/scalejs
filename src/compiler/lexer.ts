import { error } from 'console';
import * as types from './types.js'

export function tokenize(inputStream: string): types.Token[] {
  const out: types.Token[] = [];

  let pos = 0, line = 1, col = 1;
  let inTag = false; // ⬅️ NEW: are we inside < ... > ?

  const push = (kind: types.TokKind, value?: string, start = pos) =>
    out.push({ kind, value, pos: start, line, col });

  function advance() {
    const ch = inputStream[pos++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  }

  function readWhile(pred: (c: string) => boolean): string {
    const start = pos;
    while (pos < inputStream.length && pred(inputStream[pos])) advance();
    return inputStream.slice(start, pos);
  }

  while (pos < inputStream.length) {
    const char = inputStream[pos];

    // ---------- { ... } handling (kept as you had it) ----------
    if (char === '{') {
      push('LBRACE', '{'); pos++; col++;

      // skip optional spaces
      while (pos < inputStream.length && /\s/.test(inputStream[pos])) advance();

      const rest = inputStream.slice(pos);

      function emitClosingBrace() {
        while (pos < inputStream.length && /\s/.test(inputStream[pos])) advance();
        if (inputStream[pos] !== '}') throw new Error("Expected '}' after control tag");
        push('RBRACE', '}'); pos++; col++;
      }

      if (rest.startsWith('#if'))      { push('HASH_IF', '#if'); pos += 3; col += 3; continue; }
      if (rest.startsWith('#each'))    { push('HASH_EACH', '#each'); pos += 5; col += 5; continue; }
      if (rest.startsWith(':else if')) { push('ELSE_IF', ':else if'); pos += 8; col += 8; emitClosingBrace(); continue; }
      if (rest.startsWith(':else'))    { push('ELSE', ':else'); pos += 5; col += 5; emitClosingBrace(); continue; }
      if (rest.startsWith('/if'))      { push('END_IF', '/if'); pos += 3; col += 3; emitClosingBrace(); continue; }
      if (rest.startsWith('/each'))    { push('END_EACH', '/each'); pos += 5; col += 5; emitClosingBrace(); continue; }

      // plain mustache body until next }
      const start = pos;
      while (pos < inputStream.length && inputStream[pos] !== '}') advance();
      const body = inputStream.slice(start, pos);
      if (body) push('TEXT', body, start);
      if (inputStream[pos] !== '}') throw new Error('Unterminated mustache');
      push('RBRACE', '}'); pos++; col++;
      continue;
    }

    if (char === '}') { push('RBRACE', '}'); pos++; col++; continue; }

    // ---------- Tag delimiters ----------
    if (char === '<') {
      push('LT', '<'); pos++; col++;
      inTag = true;                // ⬅️ enter TAG context
      continue;
    }
    if (char === '>') {
      push('GT', '>'); pos++; col++;
      inTag = false;               // ⬅️ leave TAG context
      continue;
    }

    // ---------- TAG context ----------
    if (inTag) {
      // skip whitespace INSIDE tag without producing TEXT
      if (/\s/.test(char)) { advance(); continue; }

      if (char === '/') { push('SLASH', '/'); pos++; col++; continue; }
      if (char === '=') { push('EQUALS', '='); pos++; col++; continue; }
      if (char === '@') { push('AT', '@');   pos++; col++; continue; }

      if (char === '"' || char === "'") {
        // keep raw including quotes (your parser already strips if needed)
        const q = char;
        const start = pos; pos++; col++;
        while (pos < inputStream.length && inputStream[pos] !== q) {
          if (inputStream[pos] === '\\' && pos + 1 < inputStream.length) { pos++; col++; }
          if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
          pos++;
        }
        if (pos >= inputStream.length) { error('Unterminated string'); break; }
        pos++; col++; // closing quote
        push('STRING', inputStream.slice(start, pos), start);
        continue;
      }

      // Allow IDENTs for tag/attr names: first char A-Za-z _ : @
      if (/[A-Za-z_:@]/.test(char)) {
        const start = pos;
        readWhile(c => /[A-Za-z0-9_.:\-]/.test(c));   // subsequent chars
        push('IDENT', inputStream.slice(start, pos), start);
        continue;
      }

      // Numbers (for unquoted values like width=100)
      if (/[0-9]/.test(char)) {
        const start = pos;
        readWhile(c => /[0-9._-]/.test(c));
        push('NUMBER', inputStream.slice(start, pos), start);
        continue;
      }

      // Braces in TAG (for attr values like class={expr})
      if (char === '{') { push('LBRACE', '{'); pos++; col++; continue; }
      if (char === '}') { push('RBRACE', '}'); pos++; col++; continue; }

      // Any other single char in a tag: skip it (don’t emit TEXT)
      advance();
      continue;
    }

    // ---------- DATA context (outside tags) ----------
    if (/\s/.test(char)) { advance(); continue; }

    if (char === '/' ) { push('SLASH', '/'); pos++; col++; continue; }
    if (char === '=' ) { push('EQUALS', '='); pos++; col++; continue; }
    if (char === '@' ) { push('AT', '@');     pos++; col++; continue; }

    if (char === '"' || char === "'") {
      const q = char;
      const start = pos; pos++; col++;
      while (pos < inputStream.length && inputStream[pos] !== q) {
        if (inputStream[pos] === '\\' && pos + 1 < inputStream.length) { pos++; col++; }
        if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
        pos++;
      }
      if (pos >= inputStream.length) { error('Unterminated string'); break; }
      pos++; col++;
      push('STRING', inputStream.slice(start, pos), start);
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = pos;
      readWhile(c => /[0-9._-]/.test(c));
      push('NUMBER', inputStream.slice(start, pos), start);
      continue;
    }

    // Plain TEXT until a special char starts
    const start = pos;
    readWhile(c => !['{','}','<','>','/','=','@'].includes(c));
    push('TEXT', inputStream.slice(start, pos), start);
  }

  return out;
}
