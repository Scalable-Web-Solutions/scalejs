import { tokenize } from "../lexer/index.js";
import { Parser } from "./core.js";
import { ParseError, makeCodeFrame } from "./diagnostics.js";
import * as types from "../util/types.js";

export function parseTemplate(
  src: string,
  opts: { debug?: boolean; log?: (...a: any[]) => void } = {}
): types.ASTNode[] {
  const tokens = tokenize(src);
  try {
    return new Parser(tokens, src, opts).parseTemplate();
  } catch (e: any) {
    if (e instanceof ParseError) throw e;

    const last =
      tokens[Math.max(0, Math.min(tokens.length - 1, (e?.i ?? 0) - 1))];
    const line = last?.line ?? -1;
    const col = last?.col ?? -1;
    const frame = line > 0 && col > 0 ? makeCodeFrame(src, line, col) : undefined;
    throw new ParseError(String(e?.message ?? e), line, col, frame);
  }
}
