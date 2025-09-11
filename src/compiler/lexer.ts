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
        if(char === '{'){
            inMustache = true;
            // We found it so we push it into our token list
            push('LBRACE', '{');
            // Move position and col
            pos++;
            col++;
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

        if(inMustache){
            // Next section is iterating and finding our special syntax like #if
        if(char === '#' && inputStream.slice(pos, pos+3) === '#if'){
            push('HASH_IF', '#if');
            pos += 3;
            col += 3;
            continue;
        }

        if(inputStream.slice(pos, pos+8) === ':else if'){
            push('ELSE_IF', ':else if');
            pos += 8;
            col += 8;
            continue;
        }
        
        if(inputStream.slice(pos, pos+6) === ':else}'){
            // just log it as two seperarate tokens
        }

        if(inputStream.slice(pos, pos+5) === ':else'){
            push('ELSE', ':else');
            pos += 5;
            col += 5;
            continue;
        }

        if(inputStream.slice(pos, pos+4) === '/if}'){
            // same note as above
        }

        if (inputStream.slice(pos, pos+3) === '/if'){
            push('END_IF', '/if');
            pos += 3;
            col += 3;
            continue;
        }
         if (inputStream.slice(pos, pos+5) === '#each'){
            push('HASH_EACH', '#each');
            pos += 5;
            col += 5;
            continue;
        }
         if (inputStream.slice(pos, pos+6) === '/each'){
            push('END_EACH', '/each');
            pos += 6;
            col += 6;
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