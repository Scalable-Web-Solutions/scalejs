import type { Parser } from "./core.js";
import * as types from "../types.js";

export function parseTemplate(p: Parser): types.ASTNode[] {
  return parseNodes(p, () => false);
}

export function parseNodes(p: Parser, stop: () => boolean): types.ASTNode[] {
  p.enter("nodes");
  const out: types.ASTNode[] = [];
  let buf = "";

  const flush = () => {
    if (buf) {
      out.push({ kind: "Text", value: buf });
      buf = "";
    }
  };

  while (p.i < p.tks.length && !stop()) {
    const before = p.i;
    const tk = p.peek();
    if (!tk) break;

    // Elements
    if (tk.kind === "LT") {
      flush();
      out.push(p.parseElement());
      p.ensureProgress(before, "inside parseNodes (element)");
      continue;
    }

    // Blocks / Mustache
    if (tk.kind === "LBRACE") {
      const save = p.i;
      p.i++;
      p.skipWsText();
      const k1 = p.peek()?.kind;
      p.i = save;

      if (k1 === "HASH_IF") {
        flush();
        out.push(p.parseIf());
        p.ensureProgress(before, "inside parseNodes (if)");
        continue;
      }
      if (k1 === "HASH_EACH") {
        flush();
        out.push(p.parseEach());
        p.ensureProgress(before, "inside parseNodes (each)");
        continue;
      }
      if (k1 === "END_IF" || k1 === "END_EACH" || k1 === "ELSE" || k1 === "ELSE_IF") break;

      flush();
      out.push(p.parseMustache());
      p.ensureProgress(before, "inside parseNodes (mustache)");
      continue;
    }

    // Only TEXT becomes text content in data mode
    if (tk.kind === "TEXT") {
      buf += tk.value ?? "";
      p.i++;
      p.ensureProgress(before, "inside parseNodes (text)");
      continue;
    }

    // Optional: treat top-level template literals as expressions
    if (tk.kind === "STRING" && tk.value?.startsWith("`")) {
      flush();
      p.i++; // consume
      out.push({ kind: "Mustache", expr: tk.value });
      p.ensureProgress(before, "inside parseNodes (template-literal)");
      continue;
    }

    // Anything else in data mode is unexpected; fail fast
    p.error(`Unexpected ${tokRepr(tk)} in data/text mode`, tk);
  }

  flush();
  p.leave();
  return out;
}

// local pretty
function tokRepr(t?: types.Token) {
  if (!t) return "EOF";
  const v = t.value ? ` ${JSON.stringify(t.value)}` : "";
  return `${t.kind}${v}`;
}
