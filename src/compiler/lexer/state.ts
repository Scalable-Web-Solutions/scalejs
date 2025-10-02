export class State {
    constructor(public src: string) {}
    codepoints = Array.from(this.src);
    pos = 0; charPos = 0; line = 1; col = 1;
  
    snap() { return { pos: this.charPos, line: this.line, col: this.col }; }
    peek(n = 0) { return this.codepoints[this.pos + n]; }
    advance() {
      if (this.pos >= this.codepoints.length) return undefined;
      const ch = this.codepoints[this.pos++];
      this.charPos++;
      if (ch === "\n") { this.line++; this.col = 1; return ch; }
      if (ch === "\r") {
        if (this.codepoints[this.pos] === "\n") { this.pos++; this.charPos++; }
        this.line++; this.col = 1; return "\n";
      }
      this.col++; return ch;
    }
    readWhile(pred: (c: string) => boolean) {
      const start = this.pos;
      while (this.pos < this.codepoints.length && pred(this.codepoints[this.pos]!)) this.advance();
      return this.src.slice(start, this.pos);
    }
}  