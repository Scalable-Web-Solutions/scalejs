#!/usr/bin/env node

// bin/cli.js — JavaScript CLI that calls into compiled TS in bin-ts/
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compileFile } from "../bin-ts/index.js"; // compiled output from your TS

const argv = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  scalejs build <input.scale> [--out <assets/file.js>] [--tag <my-tag>]
    [--runtime-import <path>] [--block-import <path>]
    [--emit-liquid <sections/file.liquid>] [--mode wc|liquid] [--section-name "Section Name"]
    [--esm true|false] [--dev] [--sourcemap]

Examples:
  scalejs build examples/hero.scale
  scalejs build examples/hero.scale --out assets/hero.js --tag my-hero
  scalejs build examples/hero.scale --emit-liquid sections/hero.liquid --mode wc --section-name "Hero (ScaleJS)"`);
}

function getFlag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return { present: false, value: null, index: -1 };
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) {
    console.error(`✖ Missing value for ${name}`);
    process.exit(1);
  }
  return { present: true, value: v, index: i };
}

if (argv.length === 0 || argv.includes("-h") || argv.includes("--help") || argv[0] === "help") {
  usage();
  process.exit(0);
}

const cmd = argv[0];
if (cmd !== "build") {
  console.error('✖ Unknown command. Only "build" is supported.\n');
  usage();
  process.exit(1);
}

// positional input
const input = argv[1];
if (!input) {
  console.error("✖ Missing <input.scale>\n");
  usage();
  process.exit(1);
}

const cwd = process.cwd();
const inputAbs = path.resolve(cwd, input);
const defaultTag = path.basename(inputAbs).replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
const defaultOut = path.resolve(cwd, "dist", `${defaultTag}.js`);

// flags
const outFlag   = getFlag("--out");
const tagFlag   = getFlag("--tag");
const rtFlag    = getFlag("--runtime-import");
const blkFlag   = getFlag("--block-import");
const emitFlag  = getFlag("--emit-liquid");
const modeFlag  = getFlag("--mode");
const nameFlag  = getFlag("--section-name");
const esmFlag   = getFlag("--esm");
const devFlag   = argv.includes("--dev");      // boolean
const smFlag    = argv.includes("--sourcemap");// boolean

const tag = tagFlag.present ? tagFlag.value : defaultTag;
const out = outFlag.present ? path.resolve(cwd, outFlag.value) : defaultOut;

let runtimeImport = rtFlag.present ? rtFlag.value : "./runtime/dom.js";
let blockImport   = blkFlag.present ? blkFlag.value : "./runtime/block.js";

let emitLiquid = null;
let mode = null;
let sectionName = null;

if (modeFlag.present && !emitFlag.present) {
  console.warn("⚠️  --mode has no effect without --emit-liquid (ignored).");
}

if (emitFlag.present) {
  emitLiquid = path.resolve(cwd, emitFlag.value);
  mode = modeFlag.present ? modeFlag.value : "wc";
  if (!["wc", "liquid"].includes(mode)) {
    console.error('✖ Invalid --mode value. Use "wc" or "liquid".');
    process.exit(1);
  }
  sectionName = nameFlag.present ? nameFlag.value : `ScaleJS ${tag}`;
}

const esm = esmFlag.present ? esmFlag.value === "true" : true;
const dev = devFlag;
const sourcemap = smFlag;

// sanity: input exists
await fs.access(inputAbs).catch(() => {
  console.error(`✖ Input not found: ${inputAbs}`);
  process.exit(1);
});

// Run build
try {
  await compileFile({
    input: inputAbs,
    out,
    tag,
    runtimeImport,
    blockImport,
    esm: false,
    dev,
    sourcemap,
    emitLiquid,
    mode,
    sectionName
  });

  if (emitLiquid) {
    console.log(`✓ Built ${out} (tag: ${tag}), emitted liquid → ${emitLiquid} [mode: ${mode}]`);
  } else {
    console.log(`✓ Built ${out} (tag: ${tag})`);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
