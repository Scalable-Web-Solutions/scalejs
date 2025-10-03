import * as types from "../types.js";
import { ParseError, makeCodeFrame } from "../diagnostics.js";

// ---- Core Parser class: ctor + shared helpers only ----
export class Parser {
  i = 0;
  private phase: Phase = "nodes";
  private phaseStack: Phase[] = [];
  readonly tks: types.Token[];
  readonly src: string;
  readonly opts: ParserOptions;

  constructor(tks: types.Token[], src: string, opts: ParserOptions = {}) {
    this.tks = tks;
    this.src = src;
    this.opts = opts;
  }

  // ---- Debug/trace ----
  trace(...args: any[]) {
    if (this.opts.debug) this.opts.log?.("[parser]", ...args);
  }
  enter(phase: Phase) {
    this.phaseStack.push(this.phase);
    this.phase = phase;
    this.trace("enter", phase, "at", this.peek());
  }
  leave() {
    const prev = this.phaseStack.pop();
    if (prev) this.phase = prev;
    this.trace("leave→", this.phase, "at", this.peek());
  }

  // ---- Cursor helpers ----
  peek = (k = 0) => this.tks[this.i + k];
  at = (k: types.TokKind) => this.peek()?.kind === k;
  last(): types.Token | undefined { return this.tks[this.i - 1]; }

  eat(k?: types.TokKind) {
    const t = this.tks[this.i++];
    if (k && (!t || t.kind !== k)) {
      const where = t ?? this.peek();
      this.error(`Expected ${String(k)} but got ${tokRepr(where)}`, where);
    }
    if (!t) this.error(`Unexpected EOF, expected ${String(k ?? "token")}`);
    return t!;
  }

  error(msg: string, atTok?: types.Token, span = 1): never {
    const anchor = atTok ?? this.peek() ?? this.last();
    const line = anchor?.line ?? -1;
    const col = anchor?.col ?? -1;
    const frame =
      line > 0 && col > 0 ? makeCodeFrame(this.src, line, col, span) : undefined;
    throw new ParseError(msg, line, col, frame);
  }

  ensureProgress(lastI: number, context: string) {
    if (this.i === lastI) {
      const here = this.peek();
      this.error(
        `Parser made no progress ${context}. Got ${tokRepr(here)}.`,
        here
      );
    }
  }

  // ---- Text/whitespace helpers ----
  isWsText(t?: types.Token) {
    return t?.kind === "TEXT" && (!t.value || /^\s*$/.test(t.value));
  }
  skipWsText() {
    while (this.isWsText(this.peek())) this.i++;
  }

  // ---- HTML helpers ----
  isVoid(tag: string) {
    return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag);
  }

  // ---- Public methods (implemented via prototype wiring below) ----
  // (We declare them so TS knows they exist; implementations are attached later.)
  parseTemplate!: () => types.ASTNode[];
  parseNodes!: (stop: () => boolean) => types.ASTNode[];
  parseElement!: () => types.ElementNode;
  parseMustache!: () => types.MustacheNode;
  parseIf!: () => types.IfBlockNode;
  parseEach!: () => types.EachBlockNode;
  readUntilRBrace!: () => string;
  readUntilCloseBraceRaw!: () => string;
  readRawTextUntilCloseTag!: (tag: string) => string;
  nextIsCloseTag!: (tagLower: string) => boolean;
  nextIs!: (tag: "/if" | "/each" | ":else" | ":else if") => boolean;
  nextIsAny!: (...tags: Array<"/if" | "/each" | ":else" | ":else if">) => boolean;
  eatClose!: (tag: "END_IF" | "END_EACH") => void;
}

// ---- Local types & utils used by the class ----
type Phase =
  | "nodes"
  | "element-open"
  | "element-attrs"
  | "element-children"
  | "rawtext"
  | "mustache"
  | "if-head"
  | "each-head";

export type ParserOptions = {
  debug?: boolean;
  log?: (...args: any[]) => void;
};

function tokRepr(t?: types.Token) {
  if (!t) return "EOF";
  const v = t.value ? ` ${JSON.stringify(t.value)}` : "";
  return `${t.kind}${v}`;
}

// ---- Wire feature modules onto the prototype (no circular runtime deps) ----
import {
  parseTemplate as _parseTemplate,
  parseNodes as _parseNodes,
} from "./nodes.js";
import {
  parseElement as _parseElement,
  readRawTextUntilCloseTag as _readRawTextUntilCloseTag,
  nextIsCloseTag as _nextIsCloseTag,
} from "./elements.js";
import {
  parseIf as _parseIf,
  parseEach as _parseEach,
  nextIs as _nextIs,
  nextIsAny as _nextIsAny,
  eatClose as _eatClose,
} from "./blocks.js";
import {
  parseMustache as _parseMustache,
  readUntilRBrace as _readUntilRBrace,
  readUntilCloseBraceRaw as _readUntilCloseBraceRaw,
} from "./expr.js";

// Attach implementations
Parser.prototype.parseTemplate = function (this: Parser) { return _parseTemplate(this); };
Parser.prototype.parseNodes = function (this: Parser, stop: () => boolean) { return _parseNodes(this, stop); };

Parser.prototype.parseElement = function (this: Parser) { return _parseElement(this); };
Parser.prototype.readRawTextUntilCloseTag = function (this: Parser, tag: string) { return _readRawTextUntilCloseTag(this, tag); };
Parser.prototype.nextIsCloseTag = function (this: Parser, tagLower: string) { return _nextIsCloseTag(this, tagLower); };

Parser.prototype.parseIf = function (this: Parser) { return _parseIf(this); };
Parser.prototype.parseEach = function (this: Parser) { return _parseEach(this); };
Parser.prototype.nextIs = function (this: Parser, tag) { return _nextIs(this, tag); };
Parser.prototype.nextIsAny = function (this: Parser, ...tags) { return _nextIsAny(this, ...tags); };
Parser.prototype.eatClose = function (this: Parser, tag) { return _eatClose(this, tag); };

Parser.prototype.parseMustache = function (this: Parser) { return _parseMustache(this); };
Parser.prototype.readUntilRBrace = function (this: Parser) { return _readUntilRBrace(this); };
Parser.prototype.readUntilCloseBraceRaw = function (this: Parser) { return _readUntilCloseBraceRaw(this); };
