import type { Parser } from "./core.js";
import * as types from "../types.js";

export function parseElement(p: Parser): types.ElementNode {
  p.enter("element-open");
  p.eat("LT");
  const isClose = p.at("SLASH");
  if (isClose) p.eat("SLASH");

  const tagTok = p.eat("IDENT");
  const tag = tagTok.value!;
  const tagLower = tag.toLowerCase();

  const attrs: types.Attr[] = [];

  // attributes
  p.enter("element-attrs");
  while (!p.at("GT") && !(p.at("SLASH") && p.peek(1)?.kind === "GT")) {
    if (p.isWsText(p.peek())) { p.i++; continue; }

    let name = "";
    if (p.at("AT")) {
      p.eat("AT");
      name = "@" + p.eat("IDENT").value!;
    } else if (p.at("IDENT")) {
      name = p.eat("IDENT").value!;
    } else {
      p.error(`Unexpected ${tokRepr(p.peek())} in attribute list for <${tag}>`, p.peek());
    }

    let value: string | true = true;
    if (p.at("EQUALS")) {
      p.eat("EQUALS");
      if (p.at("STRING")) {
        const raw = p.eat("STRING").value ?? '""';
        if (raw.startsWith("`") && raw.endsWith("`")) {
          // template literal expression value
          attrs.push({ name, value: raw } as any);
          continue;
        } else {
          value = raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, -1) : raw;
        }
      } else if (p.at("IDENT") || p.at("NUMBER")) {
        value = (p.eat().value ?? "").trim();
      } else if (p.at("LBRACE")) {
        const expr = p.readUntilRBrace();
        attrs.push({ name, value: `{${expr}}` } as any);
        continue;
      } else {
        value = "";
      }
    }
    attrs.push({ name, value });
  }
  p.leave(); // element-attrs

  // self-closing?
  let self = false;
  if (p.at("SLASH") && p.peek(1)?.kind === "GT") {
    p.eat("SLASH");
    self = true;
  }
  p.eat("GT");
  p.leave(); // element-open

  const children: types.ASTNode[] = [];
  if (!self && !isClose && !p.isVoid(tagLower)) {
    if (isRawTextTag(tagLower)) {
      const raw = readRawTextUntilCloseTag(p, tagLower);
      p.eat("LT"); p.eat("SLASH");
      const closeName = (p.eat("IDENT").value ?? "").toLowerCase();
      if (closeName !== tagLower) p.error(`Mismatched </${closeName}> for <${tag}>`, p.peek());
      p.eat("GT");
      if (raw) children.push({ kind: "Text", value: raw });
    } else {
      p.enter("element-children");
      children.push(...p.parseNodes(() => p.nextIsCloseTag(tagLower)));
      p.eat("LT"); p.eat("SLASH");
      const closeName = (p.eat("IDENT").value ?? "").toLowerCase();
      if (closeName !== tagLower) p.error(`Mismatched </${closeName}> for <${tag}>`, p.peek());
      p.eat("GT");
      p.leave(); // element-children
    }
  }

  return { kind: "Element", tag, attrs, children };
}

export function readRawTextUntilCloseTag(p: Parser, tag: string): string {
  p.enter("rawtext");
  const want = tag.toLowerCase();
  const parts: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (
      p.at("LT") &&
      p.peek(1)?.kind === "SLASH" &&
      p.peek(2)?.kind === "IDENT" &&
      (p.peek(2)?.value ?? "").toLowerCase() === want &&
      p.peek(3)?.kind === "GT"
    ) break;

    const t = p.peek();
    if (!t) p.error(`Unclosed <${tag}> — reached EOF before </${tag}>`, p.peek());
    parts.push(p.eat().value ?? "");
  }
  p.leave();
  return parts.join("");
}

export function nextIsCloseTag(p: Parser, tagLower: string): boolean {
  return (
    p.at("LT") &&
    p.peek(1)?.kind === "SLASH" &&
    p.peek(2)?.kind === "IDENT" &&
    (p.peek(2)?.value ?? "").toLowerCase() === tagLower
  );
}

function isRawTextTag(tag: string) {
  const rawTags = ["script", "style", "code", "pre"];
  return rawTags.includes(tag.toLowerCase());
}

function tokRepr(t?: types.Token) {
  if (!t) return "EOF";
  const v = t.value ? ` ${JSON.stringify(t.value)}` : "";
  return `${t.kind}${v}`;
}
