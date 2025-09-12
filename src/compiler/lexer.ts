import { error } from 'console';
import * as types from './types.js'

export function tokenize(inputStream: string): types.Token[] {
    const out: types.Token[] = [];
    
    // Starting point - this tells our lexer where to start
    let pos = 0;
    let line = 1;
    let col = 1;

    // Helper functions for the lexer to use
    const push = (kind: types.TokKind, value?: string, start=pos) =>
        out.push({ kind, value, pos: start, line, col });

    // Helper function to read characters while a predicate is true
    function readWhile(pred: (c:string)=>boolean): string {
        const start = pos; while (pos < inputStream.length && pred(inputStream[pos])) { if (inputStream[pos] === '\n') { line++; col = 1; } else col++; pos++; }
        return inputStream.slice(start, pos);
    }

    let inMustache = false;

    while(pos < inputStream.length){
        // Getting the current character from the position we are at
        const char = inputStream[pos];

        // Starting to handle our tags
        // put this at the TOP of the main while loop, before other token kinds
        if (char === '{') {
            // emit "{"
            push('LBRACE', '{'); pos++; col++;

            // 1) skip optional whitespace right after "{"
            while (pos < inputStream.length && /\s/.test(inputStream[pos])) {
                if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
                pos++;
            }

            // 2) control heads (no generic tokenization inside braces!)
            const rest = inputStream.slice(pos);

  if (rest.startsWith('#if')) {
        push('HASH_IF', '#if'); pos += 3; col += 3;
        // let the PARSER read until the matching "}" (do NOT consume it here)
        continue;
    }
    if (rest.startsWith('#each')) {
        push('HASH_EACH', '#each'); pos += 5; col += 5;
        // let the PARSER read until the matching "}"
        continue;
    }

  // closers / else → NO body; require and emit the trailing "}" right now
            function emitClosingBrace() {
                while (pos < inputStream.length && /\s/.test(inputStream[pos])) {
                    if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
                        pos++;
                }
                if (inputStream[pos] !== '}') throw new Error("Expected '}' after control tag");
                push('RBRACE', '}'); pos++; col++;
            }

            if (rest.startsWith(':else if')) {
                push('ELSE_IF', ':else if'); pos += 8; col += 8;
                emitClosingBrace();
                continue;
            }
            if (rest.startsWith(':else')) {
                push('ELSE', ':else'); pos += 5; col += 5;   // length 5, not 6
                emitClosingBrace();
                continue;
            }
            if (rest.startsWith('/if')) {
                push('END_IF', '/if'); pos += 3; col += 3;
                emitClosingBrace();
                continue;
            }
            if (rest.startsWith('/each')) {
                push('END_EACH', '/each'); pos += 5; col += 5; // length 5, not 6
                emitClosingBrace();
                continue;
            }

  // 3) mustache expression → capture everything up to the next "}" as ONE TEXT
            const start = pos;
            while (pos < inputStream.length && inputStream[pos] !== '}') {
            if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
                pos++;
            }
            const body = inputStream.slice(start, pos);
            if (body) push('TEXT', body, start);

            if (inputStream[pos] !== '}') throw new Error('Unterminated mustache');
            push('RBRACE', '}'); pos++; col++;

            continue;
        }

        if(char === '}'){
            inMustache = false;
            // We found it so we push it into our token list
            push('RBRACE', '}');
            // Move position and col
            pos++;
            col++;
            continue;
        }

        // HTML tokens
        if(char === '<'){
            // We found it so we push it into our token list
            push('LT', '<');
            // Move position and col
            pos++;
            col++;
            continue;
        }
        if (char === '>'){
            // We found it so we push it into our token list
            push('GT', '>');
            // Move position and col
            pos++;
            col++;
            continue;
        }
        if (char === '/'){
            // We found it so we push it into our token list
            push('SLASH', '/');
            // Move position and col
            pos++;
            col++;
            continue;
        }
        if(char === '='){
            // We found it so we push it into our token list
            push('EQUALS', '=');
            // Move position and col
            pos++;
            col++;
            continue;
        }

        if(char === '@'){
            // We found it so we push it into our token list
            push('AT', '@');
            // Move position and col
            pos++;
            col++;
            continue;
        }

        // Deprecated on:events

        // helper: after a control head that has no body, require and emit the closing '}'
function emitClosingBrace() {
  // optional whitespace before '}'
  while (pos < inputStream.length && /\s/.test(inputStream[pos])) {
    if (inputStream[pos] === '\n') { line++; col = 1; } else col++;
    pos++;
  }
  if (inputStream[pos] !== '}') {
    throw new Error("Expected '}' after control tag");
  }
  // consume and emit the '}'
  push('RBRACE', '}');
  pos++; col++;
  inMustache = false; // we just closed the mustache
}

if (inMustache) {
  // control heads with a body (parser will read until next '}')
  if (inputStream.slice(pos, pos+3) === '#if') {
    push('HASH_IF', '#if'); pos += 3; col += 3; continue;
  }
  if (inputStream.slice(pos, pos+5) === '#each') {
    push('HASH_EACH', '#each'); pos += 5; col += 5; continue;
  }

  // control heads with NO body → also emit the trailing '}' NOW
  if (inputStream.slice(pos, pos+8) === ':else if') {
    push('ELSE_IF', ':else if'); pos += 8; col += 8;
    emitClosingBrace();
    continue;
  }
  if (inputStream.slice(pos, pos+5) === ':else') {
    push('ELSE', ':else'); pos += 5; col += 5;
    emitClosingBrace();
    continue;
  }
  if (inputStream.slice(pos, pos+3) === '/if') {
    push('END_IF', '/if'); pos += 3; col += 3;
    emitClosingBrace();
    continue;
  }
  if (inputStream.slice(pos, pos+5) === '/each') {       // NOTE: 5, not 6
    push('END_EACH', '/each'); pos += 5; col += 5;
    emitClosingBrace();
    continue;
  }
}


        // Holy fuck so many if statements -- Moving on to strings
        if (char === '"' || char === "'") {
            const q = char;
            const start = pos;      // if you want raw with quotes
            pos++; col++;           // consume opening quote

            while (pos < inputStream.length && inputStream[pos] !== q) {
              if (inputStream[pos] === '\\' && pos + 1 < inputStream.length) {
                // skip escaped char
                pos++; col++;
              }
              if (inputStream[pos] === '\n') { line++; col = 1; }
              else { col++; }
              pos++;
            }
        
            if (pos >= inputStream.length) {
              error('Unterminated string');
              break;
            }
        
            pos++; col++; // <-- consume closing quote
        
            // choose ONE of these two representations:
        
            // 1) Raw (including quotes):
            push('STRING', inputStream.slice(start, pos));
            // 2) Unquoted:
            // push('STRING', inputStream.slice(start + 1, pos - 1));

            continue;
        }
        // identifier
        if (/[A-Za-z_]/.test(char)) {
            const start = pos;
            readWhile(ch => /[A-Za-z0-9_\-:.]/.test(ch));
            const val = inputStream.slice(start, pos);
            // Defer special words to parser; here, it’s IDENT/TEXT boundary
            push('IDENT', val);
            continue;
        }

        // number
        if (/[0-9]/.test(char)) {
            const start = pos;
            readWhile(ch => /[0-9._]/.test(ch));
            push('NUMBER', inputStream.slice(start, pos));
            continue;
        }

        const start = pos;
        readWhile(ch => !['{','}','<','>','/','=','@'].includes(ch));
        push('TEXT', inputStream.slice(start, pos));
    }
    return out;
}