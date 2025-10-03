// bin-ts/index.ts (TS — will compile to JS)
// Re-export compile + add a file helper the CLI can call.

import fs from "node:fs/promises";
import path from "node:path";
import { compile, type CompileOptions } from "./compiler/index.js";

export async function compileFile(opts: {
  input: string;
  out: string;
  tag: string;
  inlineRuntime?: boolean;
  runtimeImport?: string;
  blockImport?: string;
  props?: import("./compiler/util/types.js").Prop[];
  derived?: import("./compiler/util/types.js").Derived[];
  esm?: boolean;
  dev?: boolean;
  sourcemap?: boolean;
  emitLiquid?: string | null;                 // optional
  mode?: "wc" | "liquid" | null;              // optional
  sectionName?: string | null;                // optional
}) {
  const {
    input, out, tag,
    inlineRuntime = false,
    runtimeImport = "./runtime/dom.js",
    blockImport   = "./runtime/block.js",
    props = [],
    derived = [],
    esm = true,
    dev = false,
    sourcemap = false,
    emitLiquid = null,
    mode = null,
    sectionName = null,
  } = opts;

  const src = await fs.readFile(input, "utf8");

  const { code } = await compile(src, {
    tag,
    runtimeImport,
    blockImport,
    props,
    derived,
    esm,
    dev,
    sourcemap,
  } as CompileOptions);

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, code, "utf8");
  // if (map && sourcemap) await fs.writeFile(out + ".map", JSON.stringify(map), "utf8");

  // Optional: emit Liquid (stub/hook — replace with your real liquid generator if you have one)
  if (emitLiquid) {
    const liquid = generateLiquidStub({ tag, sectionName: sectionName ?? `ScaleJS ${tag}`, mode: mode ?? "wc" });
    await fs.mkdir(path.dirname(emitLiquid), { recursive: true });
    await fs.writeFile(emitLiquid, liquid, "utf8");
  }
}

// Very simple liquid placeholder; swap for your real generator when ready.
function generateLiquidStub({ tag, sectionName, mode }: { tag: string; sectionName: string; mode: "wc" | "liquid" }) {
  return `{% comment %} Stub section generated for ${sectionName} (${mode}) {% endcomment %}
<div id="${tag}-mount"></div>`;
}

// Re-export for convenience if you also want programmatic usage
export { compile } from "./compiler/index.js";