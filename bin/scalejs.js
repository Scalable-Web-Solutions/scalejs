#!/usr/bin/env node

// Wrote initial file, chat gpt just fixed my errors

import { compileFile } from '../bin-ts/index.js';

const argv = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  scalejs build <input.scale> --out <assets/file.js> --tag <my-tag>
    [--emit-liquid <sections/file.liquid>] [--mode wc|liquid] [--section-name "Section Name"]

Examples:
  scalejs build examples/hero.scale --out assets/hero.js --tag my-hero
  scalejs build examples/hero.scale --out assets/hero.js --tag my-hero \\
    --emit-liquid sections/hero.liquid --mode wc --section-name "Hero (ScaleJS)"`);
}

function getFlag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return { present: false, value: null, index: -1 };
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) {
    console.error(`Missing value for ${name}`);
    process.exit(1);
  }
  return { present: true, value: v, index: i };
}

if (argv.length === 0 || argv.includes('-h') || argv.includes('--help') || argv[0] === 'help') {
  usage();
  process.exit(0);
}

const cmd = argv[0];
if (cmd !== 'build') {
  console.error('Unknown command. Only "build" is supported.\n');
  usage();
  process.exit(1);
}

// positional: input file is argv[1]
const input = argv[1];
if (!input) {
  console.error('Missing <input.scale>\n');
  usage();
  process.exit(1);
}

// required flags
const outFlag = getFlag('--out');
const tagFlag = getFlag('--tag');

const out = outFlag.value;
const tag = tagFlag.value;

// optional flags
const emitFlag = getFlag('--emit-liquid');   // optional
const modeFlag = getFlag('--mode');          // optional, defaults to 'wc' if emit-liquid is set
const nameFlag = getFlag('--section-name');  // optional, default based on tag

// validate emit-liquid group (if one is present, ensure mode + name have sensible defaults)
let emitLiquid = null;
let mode = null;
let sectionName = null;

if (emitFlag.present) {
  emitLiquid = emitFlag.value;
  mode = modeFlag.present ? modeFlag.value : 'wc';
  if (!['wc', 'liquid'].includes(mode)) {
    console.error('Invalid --mode value. Use "wc" or "liquid".');
    process.exit(1);
  }
  sectionName = nameFlag.present ? nameFlag.value : `ScaleJS ${tag}`;
}

// do the build
compileFile(
  emitLiquid
    ? { input, out, tag, emitLiquid, mode, sectionName }
    : { input, out, tag }
).then(() => {
  if (emitLiquid) {
    console.log(`✓ Built ${out} (tag: ${tag}), emitted liquid → ${emitLiquid} [mode: ${mode}]`);
  } else {
    console.log(`✓ Built ${out} (tag: ${tag})`);
  }
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
