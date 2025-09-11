// compileFile.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseScale } from './compiler/parser.js';
import { generateIIFE } from './compiler/generator.js';
import { buildTwForTemplate } from './compiler/tailwind.js';
import { generateLiquid } from './compiler/liquid.js';

export async function compileFile(opts: {
  input: string;
  out: string;
  tag: string;
  emitLiquid?: string;
  mode?: 'wc' | 'liquid';
  sectionName?: string;
}) {
  const src = await fs.readFile(opts.input, 'utf8');

  const {
    script,
    style,
    template,     // raw string
    templateIR,   // ✅ IR for generator
    props,
    derived
  } = parseScale(src);

  const twCss = await buildTwForTemplate(template);

  const code = generateIIFE({
    tag: opts.tag,
    script,
    style: `${twCss}\n${style || ''}`,
    template: templateIR,       // ✅ pass IR
    props,
    derived
  });

  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, code, 'utf8');

  if (opts.emitLiquid) {
    const section = generateLiquid({
      name: opts.sectionName || `ScaleJS ${opts.tag}`,
      tag: opts.tag,
      template,                 // Liquid still wants raw markup
      props,
      twCss,
      mode: opts.mode || 'wc'
    });
    await fs.mkdir(path.dirname(opts.emitLiquid), { recursive: true });
    await fs.writeFile(opts.emitLiquid, section, 'utf8');
  }
}
