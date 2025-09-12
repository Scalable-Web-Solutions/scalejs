// codegen/writer.ts
export class Writer {
  private b: string[] = [];
  emit(s = '') { this.b.push(s); }
  join(...ss: string[]) { this.b.push(...ss); }
  toString() { return this.b.join('\n'); }
}