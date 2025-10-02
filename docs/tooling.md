# Tooling and Build Pipeline

ScaleJS ships with a Node-based compiler CLI plus a small programmatic API. This guide summarizes how to compile components, configure runtime imports, and generate supporting assets.

## CLI commands
Install (or run through `npx`) and invoke the bundled binary:

```bash
npx scalejs build src/components/hero.scale --out compiled/hero.js --tag scale-hero
```

### `build` command
| Flag | Scope | Description |
|------|-------|-------------|
| `<input>` | required | Path to a `.scale` file or a directory tree. |
| `--out <file>` | single file | Output path for the compiled JavaScript bundle. Defaults to `compiled/scalejs/<kebab-name>.js`. |
| `--tag <tag-name>` | single file | Custom element tag (defaults to the kebab-cased filename). |
| `--out-dir <dir>` | folder | Target directory for emitted JavaScript when compiling a folder. Mirrors the source subdirectories. |
| `--runtime-import <path>` | both | Module specifier used for DOM helpers (defaults to `./runtime/dom.js`). Override when bundling your own runtime. |
| `--block-import <path>` | both | Import used for block utilities (defaults to `./runtime/block.js`). |
| `--esm true|false` | both | Emit ES module syntax instead of an IIFE wrapper (defaults to `false` for CLI builds). |
| `--dev` | both | Enables development-only assertions/HMR scaffolding in the generated shell. |
| `--sourcemap` | both | Placeholder flag for future sourcemap emission. |
| `--emit-liquid <path>` | single file | Write a Shopify Liquid section alongside the JS bundle. |
| `--liquid-dir <dir>` | folder | Folder where Liquid sections are written when compiling a directory. |
| `--mode wc|liquid` | with Liquid | Controls how templated braces are rewritten inside Liquid output (`wc` leaves them for props, `liquid` rewires them to `section.settings`). |
| `--section-name "Name"` | with Liquid | Friendly name used inside the Liquid schema. |

Folder builds recurse through subdirectories and compile every `.scale` file they find, preserving relative structure.

### `minify` command
`npx scalejs minify` delegates to `bin/build.mjs`, which runs your esbuild/minification pipeline over the compiled output. Adjust that script to match your deployment strategy.

### Watch script
`bin/watch.js` demonstrates how to pair `chokidar` with the CLI for live rebuilds. Modify the `args` array to point at your component library.

## Programmatic use
Import `compileFile` or `compile` if you need to integrate the compiler into a custom build:

```ts
import { compile } from 'scalejs/dist/index.js';

const source = await fs.readFile('hero.scale', 'utf8');
const { code } = await compile(source, {
  tag: 'scale-hero',
  runtimeImport: './runtime/dom.js',
  blockImport: './runtime/block.js',
  props: [],
  derived: [],
  esm: true,
  dev: false,
  sourcemap: false
});
```

Or call `compileFile` with filesystem paths (the CLI is a thin wrapper around this helper). Optional parameters include:

- `inlineRuntime` (reserved) ? currently unused hook for bundling runtime code inline.
- `props` ? additional prop metadata to merge with hoisted `export let` declarations.
- `derived` ? computed state definitions (`{ name, expr, deps }`) evaluated during each flush.
- `emitLiquid`, `mode`, `sectionName` ? mirror the CLI flags for Liquid emission.
- `dev`, `esm`, `sourcemap` ? control code generation mode.

The function ensures the output directory exists and writes the generated code (and optional Liquid stub).

## Tailwind integration
During compilation the AST is converted back into HTML (`astToHtml`) and fed into `tailwindcss`'s CLI. Important details:
- Install `tailwindcss` in the project (`pnpm add -D tailwindcss`) so the compiler can resolve its binary.
- Tailwind content is generated in a temporary directory and minified before being embedded into the component shell.
- Static class names, directive `class:*` attributes, and string literals inside dynamic expressions are harvested to populate Tailwind's safelist.
- Add `<!-- tw:safelist ... -->` comments to force-include extra utility classes.
- The shell injects the resulting CSS into the Shadow DOM via constructable stylesheets when supported, or falls back to `<style>` tags (scoped when running in light DOM mode).

## Shopify Liquid output
When `--emit-liquid` or `--liquid-dir` is provided the compiler also writes a `.liquid` snippet:
- In `wc` mode the Liquid file loads the generated JS bundle and renders the custom element with props bound to `section.settings` values.
- In `liquid` mode the HTML is expanded server-side by rewriting `{prop}` expressions into `{{ section.settings.prop }}`.
- `<slot name="foo"></slot>` markers are converted into Liquid block stubs so merchants can fill slots through the theme editor.

Use `--section-name` to label the section inside Shopify's schema; the compiler infers simple setting types (text, checkbox, number) from prop defaults.

## Runtime customization
The generated bundle imports two modules by default:
- `runtime/dom` provides DOM helpers (`element`, `text`, `set_data`, listeners, etc.).
- `runtime/block` defines the block interface and dirty mask type.

You can supply alternative module paths via `--runtime-import` / `--block-import` as long as they expose the same API shape.

All output is plain JavaScript; integrate it with your existing bundler or ship the bundles directly with `<script defer>` tags.
