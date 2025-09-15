#!/usr/bin/env node
// bin/build.mjs
import { build } from 'esbuild';
import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to THIS FILE (bin/)
const compiledDir = path.resolve(__dirname, '../compiled/scalejs');
const outDir = path.join(compiledDir, 'min');

// Ensure output dir exists
fs.mkdirSync(outDir, { recursive: true });

// Expand all JS files under compiled/scalejs
const entryPoints = await fg('**/*.js', { cwd: compiledDir, absolute: true });

// Build & minify each file, preserving structure under /min via outbase
await build({
  entryPoints,
  outdir: outDir,
  outbase: compiledDir,     // <-- keeps subfolder structure under /min
  bundle: false,            // one output per input
  minify: true,
  sourcemap: true,
  target: 'es2020',
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
});

console.log('✓ built and minified everything in compiled/scalejs → compiled/scalejs/min/');
