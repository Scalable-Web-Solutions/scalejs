// compileFile.ts (dev lean: no Tailwind, no Liquid)
import fs from "node:fs/promises";
import path from "node:path";

import { parseTemplate } from "./compiler/parser.js";               // ✅ your AST parser
import { astToHtmlAndMeta } from "./compiler/ast.js"; // ✅ IR builder
import { generateIIFE } from "./compiler/generator.js";
import { tokenize } from "./compiler/lexer.js";

// Minimal types (align with your project's)
type Prop = { name: string; defaultVal?: string };
type Derived = { name: string; expr: string; deps: string[] };


export async function compileFile(opts: {
  input: string;
  out: string;
  tag: string;
}) {
  const src = await fs.readFile(opts.input, "utf8");

  // 1) split blocks
  const { script, style, template } = splitBlocks(src);

  const toks = tokenize(template);
  const preview = toks.slice(0, 20).map(t => `${t.kind}${t.value?`(${JSON.stringify(t.value)})`:''}`).join(' ');
  console.log("[lex] first tokens:", preview);

  // 2) parse → AST → IR
  const templateAst = parseTemplate(template);
  const templateIR  = astToHtmlAndMeta(templateAst);

  // 3) script analysis (props/derived) – simple & compatible with your generator
  const { props, derived } = analyzeScript(script);

  // 4) sanity (helps catch parser/IR wiring bugs fast)
  const hasBraces = /{[#/:]|{[^}]+}/.test(template);
  const hasBinds  = /<sws-bind\b/.test(templateIR.html);
  const hasIf     = (templateIR.ifBlocks?.length ?? 0) > 0;
  const hasEach   = (templateIR.eachBlocks?.length ?? 0) > 0;
  if (hasBraces && !hasBinds && !hasIf && !hasEach) {
    console.error("[scalejs] Parser emitted empty IR for templated file.");
    console.error("Raw template (head):", template.slice(0, 300));
    console.error("IR.html (head):", templateIR.html.slice(0, 300));
    throw new Error("Parser→IR failed: no <sws-bind>/if/each detected.");
  }

  // 5) codegen (IMPORTANT: pass IR under `template`)
  const code = generateIIFE({
    tag: opts.tag,
    script,
    style,                 // dev: no Tailwind concatenation
    templateIR: templateIR,  // ✅ IR here
    props,
    derived,
  });

  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  await fs.writeFile(opts.out, code, "utf8");
}

/* ----------------- helpers ----------------- */

// Robust-ish splitter for <script>, <style>, <template>
function splitBlocks(src: string) {
  const grab = (tag: "script" | "style" | "template") => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = src.match(re);
    return m ? { full: m[0], inner: m[1].trim() } : null;
  };

  const script = grab("script");
  const style  = grab("style");
  const tmpl   = grab("template");

  let template: string;
  if (tmpl) {
    template = tmpl.inner;
  } else {
    // No <template> section → treat everything outside <script>/<style> as template
    let rest = src;
    if (script) rest = rest.replace(script.full, "");
    if (style)  rest = rest.replace(style.full, "");
    template = rest.trim();
  }

  return {
    script:   script?.inner ?? "",
    style:    style?.inner ?? "",
    template,
  };
}

// Simple script analyzer compatible with your generator
function analyzeScript(scriptSrc: string): { props: Prop[]; derived: Derived[] } {
  const props: Prop[] = [];
  const derived: Derived[] = [];

  // export let foo = 123; / export let foo;
  const propRe = /export\s+let\s+([A-Za-z_]\w*)(?:\s*=\s*([^;]+))?;/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(scriptSrc))) {
    const name = m[1];
    const rawDefault = m[2]?.trim();
    props.push({ name, defaultVal: rawDefault });
  }

  // $: foo = bar + baz;   // collect deps naively from identifiers
  const reactiveRe = /^\s*\$:\s*([^=\n]+?)\s*=\s*([^;]+);?/gm;
  while ((m = reactiveRe.exec(scriptSrc))) {
    const name = m[1].trim();
    const expr = m[2].trim();
    const deps = Array.from(new Set((expr.match(/[A-Za-z_]\w*/g) || [])))
      .filter(id => !/^(true|false|null|undefined)$/.test(id));
    derived.push({ name, expr, deps });
  }

  return { props, derived };
}
