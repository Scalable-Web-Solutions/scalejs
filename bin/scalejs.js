#!/usr/bin/env node

// bin/cli.js — JS CLI that calls into compiled TS in bin-ts/
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {compileFile} from "../dist/index.js";

const argv = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  scalejs build <input.scale|folder> [--out <file.js>] [--tag <my-tag>]            # single-file mode
  scalejs build <folder> [--out-dir <dist>] [--liquid-dir <sections>]              # folder mode
    [--runtime-import <path>] [--block-import <path>]
    [--mode wc|liquid] [--section-name "Section Name"]
    [--esm true|false] [--dev] [--sourcemap]

Examples (single file):
  scalejs build examples/hero.scale
  scalejs build examples/hero.scale --out assets/hero.js --tag my-hero
  scalejs build examples/hero.scale --mode wc --section-name "Hero (ScaleJS)"

Examples (folder):
  scalejs build src/components
  scalejs build src/components --out-dir scalejs/components
  scalejs build src/sections --out-dir assets --liquid-dir sections --mode wc`);
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

// positional input (file or folder)
const input = argv[1];
if (!input) {
  console.error("✖ Missing <input.scale|folder>\n");
  usage();
  process.exit(1);
}

const cwd = process.cwd();
const inputAbs = path.resolve(cwd, input);

// shared flags
const rtFlag   = getFlag("--runtime-import");
const blkFlag  = getFlag("--block-import");
const modeFlag = getFlag("--mode");
const nameFlag = getFlag("--section-name");
const esmFlag  = getFlag("--esm");
const devFlag  = argv.includes("--dev");       // boolean
const smFlag   = argv.includes("--sourcemap"); // boolean

let runtimeImport = rtFlag.present ? rtFlag.value : "./runtime/dom.js";
let blockImport   = blkFlag.present ? blkFlag.value : "./runtime/block.js";

const esm = esmFlag.present ? esmFlag.value === "true" : true;
const dev = devFlag;
const sourcemap = smFlag;

// single-file-only flags
const outFlag = getFlag("--out");
const tagFlag = getFlag("--tag");
const emitFlagSingle = getFlag("--emit-liquid"); // single-file path

// folder-only flags
const outDirFlag    = getFlag("--out-dir");
const liquidDirFlag = getFlag("--liquid-dir");   // directory for folder mode

// helpers
const toKebab = (s) => s.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
const ensureDir = (p) => fs.mkdir(p, { recursive: true });

async function statSafe(p) { try { return await fs.stat(p); } catch { return null; } }

// recursive walk for *.scale
async function* walkScales(root) {
  const dirents = await fs.readdir(root, { withFileTypes: true });
  for (const d of dirents) {
    const full = path.join(root, d.name);
    if (d.isDirectory()) {
      yield* walkScales(full);
    } else if (d.isFile() && d.name.endsWith(".scale")) {
      yield full;
    }
  }
}

async function buildSingleFile(inputFileAbs) {
  const defaultTag = toKebab(path.basename(inputFileAbs));
  const defaultOut = path.resolve(cwd, "compiled", "scalejs", `${defaultTag}.js`);

  const tag = tagFlag.present ? tagFlag.value : defaultTag;
  const out = outFlag.present ? path.resolve(cwd, outFlag.value) : defaultOut;

  let emitLiquid = null;
  let mode = null;
  let sectionName = null;

  if (modeFlag.present && !emitFlagSingle.present) {
    console.warn("⚠️  --mode has no effect without --emit-liquid (ignored).");
  }
  if (emitFlagSingle.present) {
    emitLiquid = path.resolve(cwd, emitFlagSingle.value);
    mode = modeFlag.present ? modeFlag.value : "wc";
    if (!["wc", "liquid"].includes(mode)) {
      console.error('✖ Invalid --mode value. Use "wc" or "liquid".');
      process.exit(1);
    }
    sectionName = nameFlag.present ? nameFlag.value : `ScaleJS ${tag}`;
  }

  await ensureDir(path.dirname(out));
  if (emitLiquid) await ensureDir(path.dirname(emitLiquid));

  await compileFile({
    input: inputFileAbs,
    out,
    tag,
    runtimeImport,
    blockImport,
    esm: false, // keep IIFE unless you want to expose flag
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
}

async function buildFolder(folderAbs) {
  const outDir = outDirFlag.present ? path.resolve(cwd, outDirFlag.value) : path.resolve(cwd, "compiled", "scalejs");
  const liquidDir = liquidDirFlag.present ? path.resolve(cwd, liquidDirFlag.value) : null;

  if (modeFlag.present && !liquidDir) {
    console.warn("⚠️  --mode has no effect without --liquid-dir (ignored in folder mode).");
  }

  await ensureDir(outDir);
  if (liquidDir) await ensureDir(liquidDir);

  let count = 0;
  for await (const fileAbs of walkScales(folderAbs)) {
    const rel = path.relative(folderAbs, fileAbs);           // e.g. buttons/nav.scale
    const base = path.basename(fileAbs, ".scale");           // e.g. nav
    const tag  = toKebab(base);                              // e.g. nav (kebab)
    const outJs = path.join(outDir, path.dirname(rel), `${base}.js`);
    const outLiquid = liquidDir ? path.join(liquidDir, path.dirname(rel), `${base}.liquid`) : null;

    await ensureDir(path.dirname(outJs));
    if (outLiquid) await ensureDir(path.dirname(outLiquid));

    const mode = liquidDir ? (modeFlag.present ? modeFlag.value : "wc") : null;
    if (mode && !["wc", "liquid"].includes(mode)) {
      console.error('✖ Invalid --mode value. Use "wc" or "liquid".');
      process.exit(1);
    }
    const sectionName = nameFlag.present ? nameFlag.value : `${base} (ScaleJS)`;

    await compileFile({
      input: fileAbs,
      out: outJs,
      tag,
      runtimeImport,
      blockImport,
      esm: false,
      dev,
      sourcemap,
      emitLiquid: outLiquid,
      mode,
      sectionName
    });

    console.log(`✓ ${path.join(path.dirname(rel), base)} → <${tag}>`);
    count++;
  }

  if (count === 0) {
    console.warn(`(no .scale files found under ${folderAbs})`);
  } else {
    console.log(`✔ Built ${count} component${count === 1 ? "" : "s"} to ${outDir}${liquidDir ? `; liquid → ${liquidDir}` : ""}`);
  }
}

// main
const st = await statSafe(inputAbs);
if (!st) {
  console.error(`✖ Input not found: ${inputAbs}`);
  process.exit(1);
}

try {
  if (st.isDirectory()) {
    await buildFolder(inputAbs);
  } else if (st.isFile()) {
    if (!inputAbs.endsWith(".scale")) {
      console.error("✖ Single-file mode requires a .scale file");
      process.exit(1);
    }
    await buildSingleFile(inputAbs);
  } else {
    console.error("✖ Input must be a file or folder");
    process.exit(1);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}