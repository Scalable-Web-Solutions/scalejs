import * as types from "./types.js";
import { tokenize } from "./lexer.js";

class Parser {
  tks: types.Token[]; i = 0;
  constructor(tks: types.Token[]) { this.tks = tks; }

  peek = (k=0) => this.tks[this.i + k];
  at = (k: types.TokKind) => this.peek()?.kind === k;
  eat(k?: types.TokKind) {
    const t = this.tks[this.i++]; 
    if (k && (!t || t.kind !== k)) {
      const where = t ?? this.peek();
      throw new Error(`Expected ${k} @ line ${where?.line ?? -1} col ${where?.col ?? -1}`);
    }
    return t!;
  }

  private isRawTextTag(tag: string) {
  return tag.toLowerCase() === 'script' || tag.toLowerCase() === 'style';
}

// Read everything literally until </tag>, without interpreting { … }
private readRawTextUntilCloseTag(tag: string): string {
  const parts: string[] = [];
  // We are positioned just after '>' of the opening tag.
  while (
    !(this.at('LT') &&
      this.peek(1)?.kind === 'SLASH' &&
      this.peek(2)?.kind === 'IDENT' &&
      this.peek(2)?.value === tag &&
      this.peek(3)?.kind === 'GT')
  ) {
    const t = this.eat();               // consume whatever the lexer gives us
    parts.push(t.value ?? '');          // keep braces, hashes, etc. verbatim
    if (this.i >= this.tks.length) break;
  }
  return parts.join('');
}

// --- ATTR helpers -------------------------------------------------
private readAttrName(): string {
  // Handles @click, on:click, data-value, class:list, etc.
  let name = '';
  if (this.at('AT')) { this.eat('AT'); name += '@'; }
  name += this.eat('IDENT').value ?? '';
  while (this.at('COLON') || this.at('DASH') || this.at('DOT')) {
    name += this.eat().value ?? '';
    if (this.at('IDENT')) name += this.eat('IDENT').value ?? '';
  }
  return name;
}

private readQuotedStringValue(): string {
  // Lexer may include surrounding quotes in STRING.value → strip if present
  const raw = this.eat('STRING').value ?? '';
  const a = raw[0], b = raw[raw.length - 1];
  if ((a === '"' && b === '"') || (a === "'" && b === "'")) return raw.slice(1, -1);
  return raw;
}

private isAttrValueStop(): boolean {
  // Stop unquoted value on whitespace or tag end (`>` or `/>`)
  return this.isWsText(this.peek())
      || this.at('GT')
      || (this.at('SLASH') && this.peek(1)?.kind === 'GT');
}

private readUnquotedValue(): string {
  // Join a run of IDENT/NUMBER/TEXT/DASH/DOT/COLON into one value
  const parts: string[] = [];
  // tolerate stray TEXT (e.g. spaces between classes are handled by stop check)
  while (!this.isAttrValueStop()) {
    const k = this.peek()?.kind;
    if (k === 'IDENT' || k === 'NUMBER' || k === 'TEXT' || k === 'DASH' || k === 'DOT' || k === 'COLON') {
      parts.push(this.eat().value ?? '');
    } else {
      break;
    }
  }
  return parts.join('').trim();
}



  // ws TEXT helpers (tokens your lexer emits as TEXT(" "), "\n", etc.)
  private isWsText(t?: types.Token){ return t?.kind === 'TEXT' && (!t.value || /^\s*$/.test(t.value)); }
  private skipWsText(){ while (this.isWsText(this.peek())) this.i++; }

  // ---- entry
  parseTemplate(): types.ASTNode[] { return this.parseNodes(() => false); }

  // ---- generic node loop
  private parseNodes(stop: () => boolean): types.ASTNode[] {
    const out: types.ASTNode[] = [];
    let buf = '';
    const flush = () => { if (buf) { out.push({ kind:'Text', value: buf } as any); buf = ''; } };

    while (this.i < this.tks.length && !stop()) {
      const tk = this.peek(); if (!tk) break;

      // 1) Elements
      if (tk.kind === 'LT') { flush(); out.push(this.parseElement()); continue; }

      // 2) Braces: blocks or mustache
      if (tk.kind === 'LBRACE') {
        // look past optional ws TEXT right after '{'
        const save = this.i; this.i++; this.skipWsText(); const k1 = this.peek()?.kind; this.i = save;

        if (k1 === 'HASH_IF')   { flush(); out.push(this.parseIf());   continue; }
        if (k1 === 'HASH_EACH') { flush(); out.push(this.parseEach()); continue; }
        if (k1 === 'END_IF' || k1 === 'END_EACH' || k1 === 'ELSE' || k1 === 'ELSE_IF') break;

        flush(); out.push(this.parseMustache()); continue;
      }

      // 3) Coalesce text (and any stray non-modeled tokens) into Text
      buf += tk.value ?? ''; this.i++;
    }

    flush(); return out;
  }

  // ---- Elements: <tag attrs> children </tag>  |  <tag attrs />
  private parseElement(): types.ElementNode {
    this.eat('LT');
    const isClose = this.at('SLASH'); if (isClose) this.eat('SLASH');

    const tag = this.eat('IDENT').value!;
    const attrs: Array<{ name:string; value?: string|boolean }> = [];

    // attributes
    while (!this.at('GT') && !(this.at('SLASH') && this.peek(1)?.kind === 'GT')) {
      if (this.isWsText(this.peek())) { this.i++; continue; }

      let name = '';
      if (this.at('AT')) { this.eat('AT'); name = '@' + this.eat('IDENT').value!; }           // @click
      else if (this.at('IDENT')) { name = this.eat('IDENT').value!; }                         // class, id, on:click
      else { /* junk between attrs */ this.i++; continue; }

      // default boolean
      let value: string | boolean | undefined = true;
      if (this.at('EQUALS')) {
        this.eat('EQUALS');
        if (this.at('STRING')) {
          const raw = this.eat('STRING').value ?? '""';
          value = raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, -1) : raw;
        } else if (this.at('IDENT') || this.at('NUMBER') || this.at('TEXT')) {
          value = (this.eat().value ?? '').trim();
        } else {
          value = '';
        }
      }

      attrs.push({ name, value });
    }

    // self-closing?
    let self = false;
    if (this.at('SLASH') && this.peek(1)?.kind === 'GT') { this.eat('SLASH'); self = true; }
    this.eat('GT');

    const children: types.ASTNode[] = [];
if (!self && !isClose && !this.isVoid(tag)) {
  if (this.isRawTextTag(tag)) {
    // raw text mode: do not parse {…} as mustaches/blocks
    const raw = this.readRawTextUntilCloseTag(tag);
    // consume the closing tag
    this.eat('LT'); this.eat('SLASH');
    const closeName = this.eat('IDENT').value!;
    if (closeName !== tag) throw new Error(`Mismatched </${closeName}> for <${tag}>`);
    this.eat('GT');
    // keep the script/style content as a single Text child
    if (raw) children.push({ kind: 'Text', value: raw } as any);
  } else {
    // normal content: parse nodes (mustaches, if/each, etc.)
    children.push(...this.parseNodes(() => this.nextIsCloseTag(tag)));
    this.eat('LT'); this.eat('SLASH');
    const closeName = this.eat('IDENT').value!;
    if (closeName !== tag) throw new Error(`Mismatched </${closeName}> for <${tag}>`);
    this.eat('GT');
  }
}



    return { kind:'Element', tag, attrs, children } as any;
  }

  private isVoid(tag: string) {
    // HTML void list; tweak as needed
    return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag);
  }

  private nextIsCloseTag(tag: string): boolean {
    return this.at('LT') && this.peek(1)?.kind === 'SLASH' && this.peek(2)?.kind === 'IDENT' && this.peek(2)?.value === tag;
  }

  // ---- Mustache { expr }
  private parseMustache(): types.MustacheNode {
    const expr = this.readUntilRBrace();
    return { kind:'Mustache', expr } as any;
  }
  private readUntilRBrace(): string {
    this.eat('LBRACE'); this.skipWsText();
    const parts:string[] = [];
    while (!this.at('RBRACE')) parts.push((this.eat().value ?? ''));
    this.eat('RBRACE');
    return parts.join('').replace(/\s+/g,' ').trim();
  }

  // ---- If / ElseIf / Else / End
  private parseIf(): types.IfBlockNode {
    this.eat('LBRACE'); this.skipWsText(); this.eat('HASH_IF');
    const cond = this.readUntilCloseBraceRaw();

    const first = this.parseNodes(() => this.nextIsAny('/if', ':else', ':else if'));
    const branches = [{ expr: cond, children: first }];

    while (this.nextIs(':else if')) {
      this.eat('LBRACE'); this.skipWsText(); this.eat('ELSE_IF');
      const e = this.readUntilCloseBraceRaw();
      const kids = this.parseNodes(() => this.nextIsAny('/if', ':else', ':else if'));
      branches.push({ expr: e, children: kids });
    }

    let elseChildren: types.ASTNode[] | undefined;
    if (this.nextIs(':else')) {
      this.eat('LBRACE'); this.skipWsText(); this.eat('ELSE'); this.eat('RBRACE');
      elseChildren = this.parseNodes(() => this.nextIs('/if'));
    }

    this.eatClose('END_IF');
    return { kind:'IfBlock', branches, elseChildren } as any;
  }

  private parseEach(): types.EachBlockNode {
    this.eat('LBRACE'); this.skipWsText(); this.eat('HASH_EACH');
    const head = this.readUntilCloseBraceRaw();

    const m = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
    const listExpr = (m ? m[1] : head).trim();
    const itemName = (m ? m[2] : 'item').trim();
    const indexName = m?.[3]?.trim();

    const children = this.parseNodes(() => this.nextIs('/each'));
    this.eatClose('END_EACH');

    return { kind:'EachBlock', listExpr, itemName, indexName, children } as any;
  }

  private readUntilCloseBraceRaw(): string {
    const parts:string[] = [];
    while (!this.at('RBRACE')) {
      const t = this.eat(); parts.push(this.isWsText(t) ? ' ' : (t.value ?? ''));
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
  private eatClose(tag: 'END_IF'|'END_EACH'){ this.eat('LBRACE'); this.skipWsText(); this.eat(tag); this.skipWsText(); this.eat('RBRACE'); }
}

// public entry
export function parseTemplate(src: string): types.ASTNode[] {
  const tokens = tokenize(src);     // your rich lexer
  //console.log(JSON.stringify(tokens))
  const p = new Parser(tokens);
  return p.parseTemplate();
}
