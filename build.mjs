// scripts/build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['dist/test.js'],
  outfile: 'dist/test.min.js',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('✓ built dist/test.min.js');