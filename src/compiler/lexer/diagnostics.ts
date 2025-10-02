import { codeFrameColumns } from "@babel/code-frame";
import chalk from "chalk";

export function makeCodeFrame(src: string, line: number, col: number, span = 1) {
  return codeFrameColumns(
    src,
    { start: { line, column: col }, end: { line, column: col + Math.max(1, span) } },
    { highlightCode: true, linesAbove: 1, linesBelow: 1 }
  );
}

export class LexError extends Error {
  constructor(msg: string, public line: number, public col: number, src: string, span = 1) {
    super(chalk.red(`${msg} (${line}:${col})\n`) + makeCodeFrame(src, line, col, span));
    this.name = "LexError";
  }
}