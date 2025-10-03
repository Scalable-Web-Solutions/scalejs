import type { Parser } from "./core.js";
import * as types from "../types.js";

export function parseMustache(p: Parser): types.MustacheNode {
  p.enter("mustache");
  const expr = readUntilRBrace(p);
  p.leave();
  return { kind: "Mustache", expr };
}

export function readUntilRBrace(p: Parser): string {
  p.eat("LBRACE");
  p.skipWsText();
  const parts: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (p.at("RBRACE")) break;
    const t = p.peek();
    if (!t) p.error('Unclosed { … } — reached EOF before "}"');
    parts.push(p.eat().value ?? "");
  }
  p.eat("RBRACE");
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function readUntilCloseBraceRaw(p: Parser): string {
  const parts: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (p.at("RBRACE")) break;
    const t = p.peek();
    if (!t) p.error("Unclosed block tag — reached EOF before `}`");
    parts.push(p.isWsText(t) ? " " : p.eat().value ?? "");
  }
  p.eat("RBRACE");
  return parts.join("").replace(/\s+/g, " ").trim();
}
