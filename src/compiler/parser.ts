//parser.ts
import * as types from "./types.js";
import { tokenize } from "./lexer.js";
import { ParseError, makeCodeFrame, tokRepr } from "./diagnostics.js";

type Phase =
  | 'nodes'
  | 'element-open'
  | 'element-attrs'
  | 'element-children'
  | 'rawtext'
  | 'mustache'
  | 'if-head'
  | 'each-head';

type ParserOptions = {
  debug?: boolean;
  log?: (...args: any[]) => void;
};

class Parser {
  private i = 0;
  private phase: Phase = 'nodes';
  private phaseStack: Phase[] = [];
  private tks: types.Token[];
  private src: string;
  private opts: ParserOptions;

  constructor(tks: types.Token[], src: string, opts: ParserOptions = {}) {
    this.tks = tks;
    this.src = src;
    this.opts = opts;
  }

  private trace(...args: any[]) {
    if (this.opts.debug) this.opts.log?.('[parser]', ...args);
  }
  private enter(phase: Phase) { this.phaseStack.push(this.phase); this.phase = phase; this.trace('enter', phase, 'at', this.peek()); }
  private leave() { const prev = this.phaseStack.pop(); if (prev) this.phase = prev; this.trace('leave→', this.phase, 'at', this.peek()); }

  peek = (k=0) => this.tks[this.i + k];
  at = (k: types.TokKind) => this.peek()?.kind === k;

  private last(): types.Token | undefined { return this.tks[this.i - 1]; }

  private error(msg: string, atTok?: types.Token, span = 1): never {
    const anchor = atTok ?? this.peek() ?? this.last();
    const line = anchor?.line ?? -1;
    const col  = anchor?.col  ?? -1;
    const frame = (line > 0 && col > 0) ? makeCodeFrame(this.src, line, col, span) : undefined;
    const phaseMsg = `While parsing ${this.phase}`;
    throw new ParseError(msg, line, col, frame);
  }

  eat(k?: types.TokKind) {
    const t = this.tks[this.i++];
    if (k && (!t || t.kind !== k)) {
      const where = t ?? this.peek();
      this.error(`Expected ${String(k)} but got ${tokRepr(where)}`, where);
    }
    if (!t) this.error(`Unexpected EOF, expected ${String(k ?? 'token')}`);
    return t!;
  }

  private ensureProgress(lastI: number, context: string) {
    if (this.i === lastI) {
      const here = this.peek();
      this.error(`Parser made no progress ${context}. Got ${tokRepr(here)}.`, here);
    }
  }

  // ============ RAW TEXT TAG support ============
  private isRawTextTag(tag: string) {
    const rawTags = ['script', 'style', 'code', 'pre'];
    return rawTags.includes(tag.toLowerCase());
  }

  private readRawTextUntilCloseTag(tag: string): string {
    this.enter('rawtext');
    const parts: string[] = [];
    while (true) {
      if (
        this.at('LT') &&
        this.peek(1)?.kind === 'SLASH' &&
        this.peek(2)?.kind === 'IDENT' &&
        this.peek(2)?.value === tag &&
        this.peek(3)?.kind === 'GT'
      ) break;

      const t = this.peek();
      if (!t) this.error(`Unclosed <${tag}> — reached EOF before </${tag}>`, this.peek());
      parts.push(this.eat().value ?? '');
    }
    this.leave();
    return parts.join('');
  }

  // ws helpers
  private isWsText(t?: types.Token){ return t?.kind === 'TEXT' && (!t.value || /^\s*$/.test(t.value)); }
  private skipWsText(){ while (this.isWsText(this.peek())) this.i++; }

  // ---- entry
  parseTemplate(): types.ASTNode[] { return this.parseNodes(() => false); }

  // ---- generic node loop
  private parseNodes(stop: () => boolean): types.ASTNode[] {
    this.enter('nodes');
    const out: types.ASTNode[] = [];
    let buf = '';
    const flush = () => { if (buf) { out.push({ kind:'Text', value: buf }); buf = ''; } };

    while (this.i < this.tks.length && !stop()) {
      const before = this.i;
      const tk = this.peek(); if (!tk) break;

      if (tk.kind === 'LT') { flush(); out.push(this.parseElement()); this.ensureProgress(before, 'inside parseNodes (element)'); continue; }

      if (tk.kind === 'CHAR') {
        buf += tk.value ?? '';
        this.i++;
        this.ensureProgress(before, 'inside parseNodes (char)');
        continue;
      }

      if (tk.kind === 'LBRACE') {
        const save = this.i; this.i++; this.skipWsText(); const k1 = this.peek()?.kind; this.i = save;

        if (k1 === 'HASH_IF')   { flush(); out.push(this.parseIf());   this.ensureProgress(before, 'inside parseNodes (if)'); continue; }
        if (k1 === 'HASH_EACH') { flush(); out.push(this.parseEach()); this.ensureProgress(before, 'inside parseNodes (each)'); continue; }
        if (k1 === 'END_IF' || k1 === 'END_EACH' || k1 === 'ELSE' || k1 === 'ELSE_IF') break;
        
        flush(); out.push(this.parseMustache()); this.ensureProgress(before, 'inside parseNodes (mustache)'); continue;
      }

      // Simple template literal handling (keep it simple for your use case)
      if (tk.kind === 'STRING' && tk.value?.startsWith('`')) {
        flush(); 
        this.i++; // consume the template literal token
        out.push({ kind: 'Mustache', expr: tk.value }); 
        this.ensureProgress(before, 'inside parseNodes (template-literal)'); 
        continue;
      }

      buf += tk.value ?? ''; this.i++;
      this.ensureProgress(before, 'inside parseNodes (text)');
    }

    flush(); this.leave(); return out;
  }

  // ---- Elements
  private parseElement(): types.ElementNode {
    this.enter('element-open');
    this.eat('LT');
    const isClose = this.at('SLASH'); if (isClose) this.eat('SLASH');

    const tagTok = this.eat('IDENT');
    const tag = tagTok.value!;
    const attrs: types.Attr[] = [];

    // attributes
    this.enter('element-attrs');
    while (!this.at('GT') && !(this.at('SLASH') && this.peek(1)?.kind === 'GT')) {
      if (this.isWsText(this.peek())) { this.i++; continue; }

      let name = '';
      if (this.at('AT')) { this.eat('AT'); name = '@' + (this.eat('IDENT').value!); }
      else if (this.at('IDENT')) { name = this.eat('IDENT').value!; }
      else {
        this.trace('skip junk in attrs:', tokRepr(this.peek()));
        this.i++; continue;
      }

      let value: string | true = true;
      if (this.at('EQUALS')) {
        this.eat('EQUALS');
        if (this.at('STRING')) {
          const raw = this.eat('STRING').value ?? '""';
          
          // Check if it's a template literal - treat as expression
          if (raw.startsWith('`') && raw.endsWith('`')) {
            // For template literals, we'll store them as special attributes
            // The IR builder will handle them as expressions
            attrs.push({ name, value: raw } as any);
            continue;
          } else {
            // Regular quoted string
            value = raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, -1) : raw;
          }
        } else if (this.at('IDENT') || this.at('NUMBER') || this.at('TEXT')) {
          value = (this.eat().value ?? '').trim();
        } else if (this.at('LBRACE')) {
          const expr = this.readUntilRBrace();
          // Store braced expressions as special format for IR builder
          attrs.push({ name, value: `{${expr}}` } as any);
          continue;
        } else {
          value = '';
        }
      }

      attrs.push({ name, value });
    }
    this.leave(); // element-attrs

    // self-closing?
    let self = false;
    if (this.at('SLASH') && this.peek(1)?.kind === 'GT') { this.eat('SLASH'); self = true; }
    this.eat('GT');
    this.leave(); // element-open

    const children: types.ASTNode[] = [];
    if (!self && !isClose && !this.isVoid(tag)) {
      if (this.isRawTextTag(tag)) {
        const raw = this.readRawTextUntilCloseTag(tag);
        this.eat('LT'); this.eat('SLASH');
        const closeName = this.eat('IDENT').value!;
        if (closeName !== tag) this.error(`Mismatched </${closeName}> for <${tag}>`, this.peek());
        this.eat('GT');
        if (raw) children.push({ kind: 'Text', value: raw });
      } else {
        this.enter('element-children');
        children.push(...this.parseNodes(() => this.nextIsCloseTag(tag)));
        this.eat('LT'); this.eat('SLASH');
        const closeName = this.eat('IDENT').value!;
        if (closeName !== tag) this.error(`Mismatched </${closeName}> for <${tag}>`, this.peek());
        this.eat('GT');
        this.leave(); // element-children
      }
    }

    return { kind:'Element', tag, attrs, children };
  }

  private isVoid(tag: string) {
    return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag);
  }

  private nextIsCloseTag(tag: string): boolean {
    return this.at('LT') && this.peek(1)?.kind === 'SLASH' && this.peek(2)?.kind === 'IDENT' && this.peek(2)?.value === tag;
  }

  // ---- Mustache { expr }
  private parseMustache(): types.MustacheNode {
    this.enter('mustache');
    const expr = this.readUntilRBrace();
    this.leave();
    return { kind:'Mustache', expr };
  }

  private readUntilRBrace(): string {
    this.eat('LBRACE'); this.skipWsText();
    const parts:string[] = [];
    while (true) {
      if (this.at('RBRACE')) break;
      const t = this.peek();
      if (!t) this.error('Unclosed { … } — reached EOF before "}"');
      parts.push((this.eat().value ?? ''));
    }
    this.eat('RBRACE');
    return parts.join('').replace(/\s+/g,' ').trim();
  }

  // ---- If / ElseIf / Else / End
  private parseIf(): types.IfBlockNode {
    this.enter('if-head');
    this.eat('LBRACE'); this.skipWsText(); this.eat('HASH_IF');
    const cond = this.readUntilCloseBraceRaw();
    this.leave();

    const first = this.parseNodes(() => this.nextIsAny('/if', ':else', ':else if'));
    const branches = [{ expr: cond, children: first }];

    while (this.nextIs(':else if')) {
      this.enter('if-head');
      this.eat('LBRACE'); this.skipWsText(); this.eat('ELSE_IF');
      const e = this.readUntilCloseBraceRaw();
      this.leave();

      const kids = this.parseNodes(() => this.nextIsAny('/if', ':else', ':else if'));
      branches.push({ expr: e, children: kids });
    }

    let elseChildren: types.ASTNode[] | undefined;
    if (this.nextIs(':else')) {
      this.eat('LBRACE'); this.skipWsText(); this.eat('ELSE'); this.eat('RBRACE');
      elseChildren = this.parseNodes(() => this.nextIs('/if'));
    }

    this.eatClose('END_IF');
    return { kind:'IfBlock', branches, elseChildren };
  }

  private parseEach(): types.EachBlockNode {
    this.enter('each-head');
    this.eat('LBRACE'); this.skipWsText(); this.eat('HASH_EACH');
    const head = this.readUntilCloseBraceRaw();
    this.leave();

    const m = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
    const listExpr = (m ? m[1] : head).trim();
    const itemName = (m ? m[2] : 'item').trim();
    const indexName = m?.[3]?.trim();

    const children = this.parseNodes(() => this.nextIs('/each'));
    this.eatClose('END_EACH');

    return { kind:'EachBlock', listExpr, itemName, indexName, children };
  }

  private readUntilCloseBraceRaw(): string {
    const parts:string[] = [];
    while (true) {
      if (this.at('RBRACE')) break;
      const t = this.peek();
      if (!t) this.error('Unclosed block tag — reached EOF before "}"');
      parts.push(this.isWsText(t) ? ' ' : (this.eat().value ?? ''));
    }
    this.eat('RBRACE');
    return parts.join('').replace(/\s+/g,' ').trim();
  }

  private nextIs(tag: '/if' | '/each' | ':else' | ':else if'): boolean {
    if (!this.at('LBRACE')) return false;
    let j = this.i + 1; while (this.isWsText(this.tks[j])) j++;
    const k = this.tks[j]?.kind;
    if (tag === '/if') return k === 'END_IF';
    if (tag === '/each') return k === 'END_EACH';
    if (tag === ':else') return k === 'ELSE';
    if (tag === ':else if') return k === 'ELSE_IF';
    return false;
  }
  private nextIsAny(...tags: Array<'/if'|'/each'|':else'|':else if'>){ return tags.some(t => this.nextIs(t)); }
  private eatClose(tag: 'END_IF'|'END_EACH'){
    this.eat('LBRACE'); this.skipWsText(); this.eat(tag); this.skipWsText(); this.eat('RBRACE');
  }
}

export function parseTemplate(src: string, opts: ParserOptions = {}): types.ASTNode[] {
  const tokens = tokenize(src);
  try {
    const p = new Parser(tokens, src, opts);
    return p.parseTemplate();
  } catch (e: any) {
    if (e instanceof ParseError) {
      const frame = e.codeFrame ? `\n${e.codeFrame}\n` : '';
      const where = (e.line > 0 && e.col > 0) ? ` (line ${e.line}, col ${e.col})` : '';
      const msg = `ParseError${where}: ${e.message}${frame}`;
      opts.log?.(msg);
      throw e;
    }
    const last = tokens[Math.min(tokens.length - 1, Math.max(0, (e?.i ?? 0) - 1))];
    const line = last?.line ?? -1, col = last?.col ?? -1;
    const frame = (line > 0 && col > 0) ? makeCodeFrame(src, line, col) : undefined;
    const wrapped = new ParseError(String(e?.message ?? e), line, col, frame);
    opts.log?.(`Parser crashed: ${wrapped.message}\n${wrapped.codeFrame ?? ''}`);
    throw wrapped;
  }
}