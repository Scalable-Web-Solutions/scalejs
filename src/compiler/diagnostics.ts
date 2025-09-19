// diagnostics.ts (or inline above Parser)
export class ParseError extends Error {
    constructor(
      message: string,
      public line: number,
      public col: number,
      public codeFrame?: string
    ){
      super(message);
      this.name = 'ParseError';
    }
  }
  
  export function makeCodeFrame(src: string, line: number, col: number, span = 1): string {
    // 1-indexed lines/cols in tokens; guard
    const lines = src.split(/\r?\n/);
    const L = Math.max(1, Math.min(line, lines.length));
    const text = lines[L - 1] ?? '';
    const caretPos = Math.max(1, col);
    const underline = ' '.repeat(Math.max(0, caretPos - 1)) + '^'.repeat(Math.max(1, span));
    return [
      `${L} | ${text}`,
      `    ${underline}`
    ].join('\n');
  }
  
  export function tokRepr(t?: { kind: any; value?: string }) {
    if (!t) return '<EOF>';
    const v = t.value ? `(${JSON.stringify(t.value)})` : '';
    return `${String(t.kind)}${v}`;
  }
  