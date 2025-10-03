import type { Parser } from "./core.js";
import * as types from "../types.js";

export function parseIf(p: Parser): types.IfBlockNode {
  p.enter("if-head");
  p.eat("LBRACE");
  p.skipWsText();
  p.eat("HASH_IF");
  const cond = p.readUntilCloseBraceRaw();
  p.leave();

  const first = p.parseNodes(() => nextIsAny(p, "/if", ":else", ":else if"));
  const branches = [{ expr: cond, children: first }];

  while (nextIs(p, ":else if")) {
    p.enter("if-head");
    p.eat("LBRACE");
    p.skipWsText();
    p.eat("ELSE_IF");
    const e = p.readUntilCloseBraceRaw();
    p.leave();
    const kids = p.parseNodes(() => nextIsAny(p, "/if", ":else", ":else if"));
    branches.push({ expr: e, children: kids });
  }

  let elseChildren: types.ASTNode[] | undefined;
  if (nextIs(p, ":else")) {
    p.eat("LBRACE");
    p.skipWsText();
    p.eat("ELSE");
    p.eat("RBRACE");
    elseChildren = p.parseNodes(() => nextIs(p, "/if"));
  }

  eatClose(p, "END_IF");
  return { kind: "IfBlock", branches, elseChildren };
}

export function parseEach(p: Parser): types.EachBlockNode {
  p.enter("each-head");
  p.eat("LBRACE");
  p.skipWsText();
  p.eat("HASH_EACH");
  const head = p.readUntilCloseBraceRaw();
  p.leave();

  const m = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
  const listExpr = (m ? m[1] : head).trim();
  const itemName = (m ? m[2] : "item").trim();
  const indexName = m?.[3]?.trim();

  const children = p.parseNodes(() => nextIs(p, "/each"));
  eatClose(p, "END_EACH");

  return { kind: "EachBlock", listExpr, itemName, indexName, children };
}

export function nextIs(p: Parser, tag: "/if" | "/each" | ":else" | ":else if"): boolean {
  if (!p.at("LBRACE")) return false;
  let j = p.i + 1;
  while (p.isWsText(p.tks[j])) j++;
  const k = p.tks[j]?.kind;
  if (tag === "/if") return k === "END_IF";
  if (tag === "/each") return k === "END_EACH";
  if (tag === ":else") return k === "ELSE";
  if (tag === ":else if") return k === "ELSE_IF";
  return false;
}

export function nextIsAny(p: Parser, ...tags: Array<"/if" | "/each" | ":else" | ":else if">) {
  return tags.some((t) => nextIs(p, t));
}

export function eatClose(p: Parser, tag: "END_IF" | "END_EACH") {
  p.eat("LBRACE");
  p.skipWsText();
  p.eat(tag);
  p.skipWsText();
  p.eat("RBRACE");
}
