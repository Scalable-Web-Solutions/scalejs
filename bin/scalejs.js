import { compileFile } from '../bin-ts/index.js';

const args = process.argv.slice(2);
if (args[0] !== 'build') {
  console.error('Usage: scalejs build <input.scale> --out <file.js> --tag <my-tag>');
  process.exit(1);
}

const input = args[1];
const outIdx = args.indexOf('--out');
const tagIdx = args.indexOf('--tag');

if (!input || outIdx === -1 || tagIdx === -1) {
  console.error('Missing --out or --tag');
  process.exit(1);
}

const out = args[outIdx + 1];
const tag = args[tagIdx + 1];

compileFile({ input, out, tag })
  .then(() => console.log(`✓ Built ${out} (tag: ${tag})`))
  .catch((e) => { console.error(e); process.exit(1); });
