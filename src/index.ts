import fs from 'node:fs/promises';
import path from 'node:path';
import { parseScale } from './compiler/parser.js';
import { generateIIFE } from './compiler/generator.js';
import { buildTwForTemplate } from './compiler/tailwind.js';

export async function compileFile(opts: { input: string; out: string; tag: string })
{
  const src = await fs.readFile(opts.input, 'utf8');
  const { script, style, template, props } = parseScale(src);
  const twCss = await buildTwForTemplate(template);
  const code = generateIIFE({ tag: opts.tag, script, style: `${twCss}\n${style || ""}`, template, props });
  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, code, 'utf8');
}