import * as types from "./types.js";
import { tokenize } from './lexer.js';
import { Derived, Prop } from "./types.js";
import { astToHtmlAndMeta } from "./ast.js";

export function parseTemplate(src: string): types.ASTNode[] {
  const tks = tokenize(src);
  let i = 0;

  function peek(k=0): types.Token|undefined { return tks[i+k]; }
  function eat(kind?: types.TokKind): types.Token {
    const tk = tks[i++];
    if (kind && (!tk || tk.kind !== kind)) throw new Error('Expected ' + kind);
    return tk!;
  }

  function at(kind: types.TokKind) { return peek()?.kind === kind; }

  function parseNodes(stop?: () => boolean): types.ASTNode[] {
    const out: types.ASTNode[] = [];
    let buf = '';

    const flushText = () => { if (buf) { out.push({ kind:'Text', value: buf }); buf = ''; } };

    while (i < tks.length && !(stop && stop())) {
      const tk = peek();
      if (!tk) break;

      // Control blocks start with '{' followed by HASH_IF / HASH_EACH / etc.
      if (tk.kind === 'LBRACE') {
        // lookahead
        const tk1 = tks[i+1];
        if (tk1?.kind === 'HASH_IF') { flushText(); out.push(parseIf()); continue; }
        if (tk1?.kind === 'HASH_EACH') { flushText(); out.push(parseEach()); continue; }
        if (tk1?.kind === 'END_IF' || tk1?.kind === 'END_EACH' || tk1?.kind === 'ELSE' || tk1?.kind === 'ELSE_IF') {
          // let upper level handle the close/else
          break;
        }
        // Otherwise a mustache expression: { <expr> }
        flushText();
        out.push(parseMustache());
        continue;
      }

      // Very light element parse: treat everything outside braces as TEXT except we can expand later.
      // For MVP, let HTML remain TEXT and rely on post-pass to pull attributes/events.
      buf += tk.value || '';
      i++;
    }
    flushText();
    return out;
  }

  function readUntilRBraceAsExpr(): string {
    // consume LBRACE
    eat('LBRACE');
    // collect raw tokens until RBRACE
    let expr = '';
    while (i < tks.length && !at('RBRACE')) {
      expr += (eat().value || '');
    }
    eat('RBRACE');
    return expr.trim();
  }

  function parseMustache(): types.MustacheNode {
    const expr = readUntilRBraceAsExpr();
    return { kind: 'Mustache', expr };
  }

  function parseIf(): types.IfBlockNode {
    eat('LBRACE'); eat('HASH_IF'); // "{#if"
    const cond = readUntilCloseBraceRaw(); // read until "}"
    const firstChildren = parseNodes(() => nextIsAnyOf('/if', ':else', ':else if'));

    let branches = [{ expr: cond.trim(), children: firstChildren }];
    let elseChildren: types.ASTNode[] | undefined;

    while (true) {
      if (nextIs(':else if')) {
        eat('LBRACE'); eat('ELSE_IF');
        const e = readUntilCloseBraceRaw();
        const kids = parseNodes(() => nextIsAnyOf('/if', ':else', ':else if'));
        branches.push({ expr: e.trim(), children: kids });
        continue;
      }
      if (nextIs(':else')) {
        eat('LBRACE'); eat('ELSE');
        eat('RBRACE'); // consume "}"
        elseChildren = parseNodes(() => nextIs('/if'));
        continue;
      }
      break;
    }

    // close {/if}
    eat('LBRACE'); eat('END_IF'); eat('RBRACE');

    return { kind: 'IfBlock', branches, elseChildren };
  }

  function parseEach(): types.EachBlockNode {
    eat('LBRACE'); eat('HASH_EACH'); // "{#each"
    const head = readUntilCloseBraceRaw(); // e.g. "goats as g, i"
    const m = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
    const listExpr = (m ? m[1] : head).trim();
    const itemName = (m ? m[2] : 'item').trim();
    const indexName = m?.[3]?.trim();

    const children = parseNodes(() => nextIs('/each'));

    // close {/each}
    eat('LBRACE'); eat('END_EACH'); eat('RBRACE');

    return { kind: 'EachBlock', listExpr, itemName, indexName, children };
  }

  function nextIs(s: '/if' | '/each' | ':else' | ':else if'): boolean {
    const a = tks[i], b = tks[i+1];
    if (!a || !b) return false;
    if (a.kind !== 'LBRACE') return false;
    if (s === '/if')      return b.kind === 'END_IF';
    if (s === '/each')    return b.kind === 'END_EACH';
    if (s === ':else')    return b.kind === 'ELSE';
    if (s === ':else if') return b.kind === 'ELSE_IF';
    return false;
  }
  function nextIsAnyOf(...xs: Array<'/if'|':else'|':else if'|'/each'>): boolean {
    return xs.some(nextIs);
  }

  function readUntilCloseBraceRaw(): string {
    // assumes we just consumed tag keyword; read tokens until RBRACE
    let txt = '';
    while (i < tks.length && !at('RBRACE')) txt += (eat().value || '');
    eat('RBRACE');
    return txt;
  }

  return parseNodes();
}

export function parseScale(fileSrc: string): {
  script: string;
  style: string;
  template: string;      // keep raw template string for Tailwind + current generator
  templateAst: types.ASTNode[];
  templateIR: types.TemplateIR; // (optional) expose your parsed AST so you can migrate codegen later
  props: Prop[];
  derived: Derived[];
  // (optional) expose your parsed AST so you can migrate codegen later
} {
  const { script, style, template } = splitBlocks(fileSrc);

  const templateAst = parseTemplate(template);
  const templateIR  = astToHtmlAndMeta(templateAst);

  const { props, derived } = analyzeScript(script);

  return { script, style, template, templateAst, templateIR, props, derived };
}

// Very small, robust-ish splitter for <script>, <style>, <template>
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


// Heuristic script analyzer until you fully swap to AST-driven compile.
function analyzeScript(scriptSrc: string): { props: Prop[]; derived: Derived[] } {
  const props: Prop[] = [];
  const derived: Derived[] = [];

  // export let foo = 123;   // prop with default
  // export let foo;         // prop without default
  const propRe = /export\s+let\s+([A-Za-z_]\w*)(?:\s*=\s*([^;]+))?;/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(scriptSrc))) {
    const name = m[1];
    const rawDefault = m[2]?.trim();
    // keep as JS snippet string; your generator already handles defaults
    props.push({ name, defaultVal: rawDefault });
  }

  // $: foo = bar + baz;          // named derived
  // $: label = `${count} clicks` // template expr
  // $: doSideEffect();           // ignore (no assignment)
  const reactiveRe = /^\s*\$:\s*([^=\n]+?)\s*=\s*([^;]+);?/gm;
  while ((m = reactiveRe.exec(scriptSrc))) {
    const name = m[1].trim();
    const expr = m[2].trim();

    // collect crude dependencies: identifiers used in expr
    const deps = Array.from(new Set(
      (expr.match(/[A-Za-z_]\w*/g) || [])
    )).filter(id =>
      id !== "true" && id !== "false" && id !== "null" && id !== "undefined"
    );

    derived.push({ name, expr, deps });
  }

  return { props, derived };
}