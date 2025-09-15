#!/usr/bin/env node
import chokidar from 'chokidar';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = path.resolve(__dirname, '../examples/hero.scale');

const args = [
  'build',
  input,
  '--out', path.resolve(__dirname, '../dist/navbar.js'),
  '--tag', 'scale-nav',
  '--emit-liquid', path.resolve(__dirname, '../dist/test.liquid'),
  '--mode', 'wc',
  '--section-name', 'ScaleJSNav (ScaleJS)',
];

function build() {
  const p = spawn('scalejs', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('close', (code) => console.log(code === 0 ? '✓ rebuilt' : `✖ build failed (${code})`));
}

function minify() {
  const p = spawn('node', ['build.mjs'], { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('close', (code) => console.log(code === 0 ? '✓ minified' : `✖ minify failed (${code})`));
}

let t;
const run = () => { clearTimeout(t); t = setTimeout(build, 80); };

chokidar.watch(input, {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  usePolling: process.platform === 'win32',
}).on('all', run);

// first build
build();
minify();