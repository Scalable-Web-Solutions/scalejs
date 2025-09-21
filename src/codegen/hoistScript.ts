// codegen/hoistScript.ts
export function hoistScript(raw: string) {
  const props: Array<{name:string, defaultVal?:string}> = [];
  const vars:  Array<{name:string, init?:string}> = [];
  const methods: Array<{name:string, body:string, deps:Set<string>}> = [];

  // -------- helpers ----------------------------------------------------------
  const identRe = /[A-Za-z_]\w*/g;
  function collectDeps(code: string): Set<string> {
    const deps = new Set<string>();
    code.replace(identRe, (id: string) => { deps.add(id); return id; });
    return deps;
  }

  function extractBracedBlock(src: string, openIndex: number): { body: string, end: number } {
    if (src[openIndex] !== '{') throw new Error('extractBracedBlock: expected "{" at openIndex');
  
    let i = openIndex + 1;       // start after the opening "{"
    let depth = 1;               // we are inside one opened block
    let inS = false, inD = false, inT = false; // ' " `
    let inSL = false, inML = false;            // // /* */
    let tplDepth = 0;
    const len = src.length;
    const start = i;
  
    while (i < len) {
      const c = src[i++];
      const n = src[i];
  
      // line/block comments
      if (inSL) { if (c === '\n') inSL = false; continue; }
      if (inML) { if (c === '*' && n === '/') { inML = false; i++; } continue; }
  
      // strings / template
      if (inS)  { if (c === '\\') { i++; continue; } if (c === '\'') inS = false; continue; }
      if (inD)  { if (c === '\\') { i++; continue; } if (c === '"')  inD = false; continue; }
      if (inT)  {
        if (c === '\\') { i++; continue; }
        if (c === '$' && n === '{') { tplDepth++; i++; continue; }
        if (c === '}' && tplDepth)  { tplDepth--; continue; }
        if (c === '`' && tplDepth === 0) { inT = false; }
        continue;
      }
  
      // enter comments / strings / template?
      if (c === '/' && n === '/') { inSL = true; i++; continue; }
      if (c === '/' && n === '*') { inML = true; i++; continue; }
      if (c === '\'') { inS = true; continue; }
      if (c === '"')  { inD = true; continue; }
      if (c === '`')  { inT = true; tplDepth = 0; continue; }
  
      if (c === '{') { depth++; continue; }
      if (c === '}') {
        depth--;
        if (depth === 0) {
          const end = i - 1;                     // index of the matching "}"
          return { body: src.slice(start, end), end };
        }
        continue;
      }
    }
    throw new Error('Unclosed block in hoistScript');
  }
  

  function findMatchingParen(src: string, openIndex: number): number {
    // expects '(' at openIndex
    let i = openIndex + 1, depth = 1;
    let inS=false,inD=false,inT=false,inSL=false,inML=false,tplDepth=0;
    while (i < src.length) {
      const c = src[i++], n = src[i];

      if (inSL) { if (c === '\n') inSL = false; continue; }
      if (inML) { if (c === '*' && n === '/') { inML = false; i++; } continue; }
      if (inS)  { if (c === '\\') { i++; continue; } if (c === '\'') inS=false; continue; }
      if (inD)  { if (c === '\\') { i++; continue; } if (c === '"')  inD=false; continue; }
      if (inT)  {
        if (c === '\\') { i++; continue; }
        if (c === '$' && n === '{') { tplDepth++; i++; continue; }
        if (c === '}' && tplDepth)  { tplDepth--; continue; }
        if (c === '`' && tplDepth === 0) { inT=false; }
        continue;
      }

      if (c === '/' && n === '/') { inSL = true; i++; continue; }
      if (c === '/' && n === '*') { inML = true; i++; continue; }
      if (c === '\'') { inS = true; continue; }
      if (c === '"')  { inD = true; continue; }
      if (c === '`')  { inT = true; tplDepth = 0; continue; }

      if (c === '(') { depth++; continue; }
      if (c === ')') { depth--; if (depth === 0) return i - 1; continue; }
    }
    return -1;
  }

  function skipWSAndComments(src: string, i: number): number {
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && src[i+1] === '/') { i += 2; while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i+1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) i++; i += 2; continue; }
      break;
    }
    return i;
  }

  // -------- props and vars (keep your regexes) --------------------------------
  raw.replace(/export\s+let\s+([A-Za-z_]\w*)\s*(=\s*([^;]+))?;/g, (_m, name, _eq, init) => {
    props.push({ name, defaultVal: init?.trim() });
    return '';
  });

  raw.replace(/(^|[^\S\r\n])let\s+([A-Za-z_]\w*)\s*(=\s*([^;]+))?;/g, (_m, _sp, name, _eq, init) => {
    vars.push({ name, init: init?.trim() });
    return '';
  });

  // -------- function declarations (exported or not) ---------------------------
  {
    const reFn = /\b(?:export\s+)?function\s+([A-Za-z_]\w*)\s*\(/g;
    for (let m; (m = reFn.exec(raw)); ) {
      const name = m[1];
      const openParen = reFn.lastIndex - 1; // points at '('
      const closeParen = findMatchingParen(raw, openParen);
      if (closeParen < 0) continue;

      let i = skipWSAndComments(raw, closeParen + 1);
      if (raw[i] !== '{') continue;
      const { body, end } = extractBracedBlock(raw, i);

      methods.push({ name, body: body.trim(), deps: collectDeps(body) });
      reFn.lastIndex = end + 1;
    }
  }

  // -------- exported arrow or function expressions ----------------------------
  // Supports: export const foo = () => { ... }
  //           export const foo = function (...) { ... }
  {
    const reArrowHead = /\bexport\s+const\s+([A-Za-z_]\w*)\s*=\s*/g;
    for (let m; (m = reArrowHead.exec(raw)); ) {
      const name = m[1];
      let i = reArrowHead.lastIndex;
      i = skipWSAndComments(raw, i);

      // function expression
      if (raw.slice(i, i+8) === 'function') {
        i += 8;
        i = skipWSAndComments(raw, i);
        if (raw[i] === '(') {
          const closeParen = findMatchingParen(raw, i);
          if (closeParen < 0) continue;
          i = skipWSAndComments(raw, closeParen + 1);
          if (raw[i] !== '{') continue;
          const { body, end } = extractBracedBlock(raw, i);
          methods.push({ name, body: body.trim(), deps: collectDeps(body) });
          reArrowHead.lastIndex = end + 1;
          continue;
        }
      }

      // arrow function: "([args]) => { ... }" OR "args => { ... }"
      // Find the next '{' after the arrow "=>"
      const arrowIdx = raw.indexOf('=>', i);
      if (arrowIdx === -1) continue;
      let j = skipWSAndComments(raw, arrowIdx + 2);
      if (raw[j] !== '{') {
        // concise body (single expression). We can still hoist it as a method body that returns that expr.
        // Capture until semicolon or newline as a fallback.
        const endE = raw.indexOf(';', j);
        const expr = raw.slice(j, endE === -1 ? raw.length : endE).trim();
        const body = `return (${expr});`;
        methods.push({ name, body, deps: collectDeps(body) });
        reArrowHead.lastIndex = (endE === -1 ? raw.length : endE) + 1;
      } else {
        // block body
        const { body, end } = extractBracedBlock(raw, j);
        methods.push({ name, body: body.trim(), deps: collectDeps(body) });
        reArrowHead.lastIndex = end + 1;
      }
    }
  }

  return { props, vars, methods };
}

export type Hoisted = {
  props:   Array<{ name: string; defaultVal?: string }>;
  vars:    Array<{ name: string; init?: string }>;
  methods: Array<{ name: string; body: string; deps: Set<string> }>;
};
