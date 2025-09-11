// parser.ts
import * as types from "./types.js"; // must export TokKind, Token, AST node types (see notes below)
import { tokenize } from "./lexer.js"; // your brace-mode lexer

// ---------- Parser implementation ----------
class Parser {
  private tks: types.Token[];
  private i = 0;

  constructor(tks: types.Token[]) {
    this.tks = tks;
  }

  private peek(k = 0): types.Token | undefined { return this.tks[this.i + k]; }
  private at(kind: types.TokKind) { return this.peek()?.kind === kind; }

  private eat(kind?: types.TokKind): types.Token {
    const tk = this.tks[this.i++];
    if (kind && (!tk || tk.kind !== kind)) {
      const where = tk ?? this.peek() ?? ({ line: -1, col: -1 } as any);
      throw new Error(`Expected ${kind} @ line ${where.line} col ${where.col}`);
    }
    return tk!;
  }

  // whitespace TEXT = TEXT that's empty or all spaces/newlines
  private isWsText(t?: types.Token) {
    return t?.kind === "TEXT" && (!t.value || /^\s*$/.test(t.value));
  }
  private skipWsText() {
    while (this.isWsText(this.peek())) this.i++;
  }

  // After a '{', look past optional ws TEXT to see next token kind
  private lookInBrace(): types.TokKind | undefined {
    let j = this.i + 1; // current should be LBRACE
    while (this.isWsText(this.tks[j])) j++;
    return this.tks[j]?.kind;
  }

  // Read "{ ... }" where "..." is a free-form expression/head.
  // Preserves spacing by joining pieces, normalizing to single spaces, trimming.
  private readUntilRBrace(): string {
    this.eat("LBRACE");
    this.skipWsText();
    const parts: string[] = [];
    while (!this.at("RBRACE")) {
      const t = this.eat();
      parts.push(t.value ?? "");
    }
    this.eat("RBRACE");
    return parts.join("").replace(/\s+/g, " ").trim();
  }

  // Same, but assumes caller already consumed the tag token (e.g. HASH_EACH),
  // and we just need to read raw text until the closing "}".
  private readUntilCloseBraceRaw(): string {
    const parts: string[] = [];
    while (!this.at("RBRACE")) {
      const t = this.eat();
      if (this.isWsText(t)) { parts.push(" "); continue; }
      parts.push(t.value ?? "");
    }
    this.eat("RBRACE");
    return parts.join("").replace(/\s+/g, " ").trim();
  }

  // Tolerant close: "{ /each }" with possible spaces around
  private eatClose(tag: "END_IF" | "END_EACH") {
    this.eat("LBRACE");
    this.skipWsText();
    this.eat(tag);
    this.skipWsText();
    this.eat("RBRACE");
  }

  private nextIs(tag: "/if" | "/each" | ":else" | ":else if"): boolean {
    if (this.peek()?.kind !== "LBRACE") return false;
    let j = this.i + 1;
    while (this.isWsText(this.tks[j])) j++;
    const k = this.tks[j]?.kind;
    if (tag === "/if") return k === "END_IF";
    if (tag === "/each") return k === "END_EACH";
    if (tag === ":else") return k === "ELSE";
    if (tag === ":else if") return k === "ELSE_IF";
    return false;
  }
  private nextIsAny(...tags: Array<"/if" | "/each" | ":else" | ":else if">): boolean {
    return tags.some(t => this.nextIs(t));
  }

  // Public entry
  parseTemplate(): types.ASTNode[] {
    return this.parseNodes(() => false);
  }

  // Generic node loop; stop() is used to end a block at matching close/else
  private parseNodes(stop: () => boolean): types.ASTNode[] {
    const out: types.ASTNode[] = [];
    let buf = "";

    const flushText = () => {
      if (buf) { out.push({ kind: "Text", value: buf } as types.ASTNode); buf = ""; }
    };

    while (this.i < this.tks.length && !stop()) {
      const tk = this.peek();
      if (!tk) break;

      if (tk.kind === "LBRACE") {
        const nextKind = this.lookInBrace();

        if (nextKind === "HASH_IF")   { flushText(); out.push(this.parseIf());   continue; }
        if (nextKind === "HASH_EACH") { flushText(); out.push(this.parseEach()); continue; }

        // Let the caller's stop() handle END_* / ELSE* tokens
        if (nextKind === "END_IF" || nextKind === "END_EACH" || nextKind === "ELSE" || nextKind === "ELSE_IF") {
          break;
        }

        // Mustache fallback
        flushText();
        out.push(this.parseMustache());
        continue;
      }

      if (tk.kind === "TEXT") { buf += tk.value ?? ""; this.i++; continue; }

      // Any other stray token outside braces → treat as text
      buf += tk.value ?? ""; this.i++;
    }

    flushText();
    return out;
  }

  private parseMustache(): types.MustacheNode {
    const expr = this.readUntilRBrace();
    return { kind: "Mustache", expr };
  }

  private parseIf(): types.IfBlockNode {
    // "{#if cond}"
    this.eat("LBRACE"); this.skipWsText(); this.eat("HASH_IF");
    const cond = this.readUntilCloseBraceRaw();

    const firstChildren = this.parseNodes(() => this.nextIsAny("/if", ":else", ":else if"));
    const branches: Array<{ expr: string; children: types.ASTNode[] }> = [
      { expr: cond, children: firstChildren }
    ];

    let elseChildren: types.ASTNode[] | undefined;

    // {:else if ...}
    while (this.nextIs(":else if")) {
      this.eat("LBRACE"); this.skipWsText(); this.eat("ELSE_IF");
      const e = this.readUntilCloseBraceRaw();
      const kids = this.parseNodes(() => this.nextIsAny("/if", ":else", ":else if"));
      branches.push({ expr: e, children: kids });
    }

    // {:else}
    if (this.nextIs(":else")) {
      this.eat("LBRACE"); this.skipWsText(); this.eat("ELSE"); this.eat("RBRACE");
      elseChildren = this.parseNodes(() => this.nextIs("/if"));
    }

    // {/if}
    this.eatClose("END_IF");

    return { kind: "IfBlock", branches, elseChildren } as types.IfBlockNode;
  }

  private parseEach(): types.EachBlockNode {
    // "{#each head}"
    this.eat("LBRACE"); this.skipWsText(); this.eat("HASH_EACH");
    const head = this.readUntilCloseBraceRaw(); // e.g. "list as item, i"

    const m = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
    const listExpr = (m ? m[1] : head).trim();
    const itemName = (m ? m[2] : "item").trim();
    const indexName = m?.[3]?.trim();

    const children = this.parseNodes(() => this.nextIs("/each"));

    this.eatClose("END_EACH");

    return { kind: "EachBlock", listExpr, itemName, indexName, children } as types.EachBlockNode;
  }
}

// ---------- Public API ----------
export function parseTemplate(src: string): types.ASTNode[] {
  const tokens = tokenize(src);
  const p = new Parser(tokens);
  return p.parseTemplate();
}
