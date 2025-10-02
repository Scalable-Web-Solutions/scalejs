// codegen/generate.ts
import { Writer } from './writer.js';
import { buildBitMapFromNames } from './bitmask.js';
import { IRNode, RenderModule } from '../compiler/types.js';
import { CompileOptions } from '../compiler/index.js';
import { emitNode } from '../emitters/frag.js';
import { makeComponentShell } from './shell.js';
import { astToRenderIR } from '../compiler/astToIR.js';
import { hoistScript } from './hoistScript.js';

const STYLEBRIDGE = `
:host{ all:initial; display:block; box-sizing:border-box; width:100%; font-family: var(--font-h1--family); }
:host *, :host *::before, :host *::after { box-sizing: inherit; }
img,video,canvas{ display:block; max-width:100%; height:auto; }
`;

function remToEm(css: string) {
  return css.replace(/rem\b/g, 'em');
}

function importantizeFontSize(css: string) {
  // Adds !important to every font-size declaration, preserving values (incl. clamp())
  return css.replace(/(^|;|\{)\s*font-size\s*:\s*([^;{}]+);/g,
    (_m, pre, val) => `${pre} font-size: ${val.trim()} !important;`);
}

// receive the RenderModule, not IRNode[]
export function generate(ir: RenderModule, opts: CompileOptions, tailwindCss: string) {
  const w = new Writer();

  // — hoist <script>
  const hoisted = ir.script ? hoistScript(ir.script) : { props: [], vars: [], methods: [] };

  // — merge CLI props with hoisted export lets (hoisted wins)
  const byName = new Map(opts.props.map(p => [p.name, { ...p }]));
  for (const p of hoisted.props) byName.set(p.name, { name: p.name, defaultVal: p.defaultVal });
  const allProps = [...byName.values()];

  // — state keys (props + hoisted vars + derived)
  const stateKeys = new Set<string>([
    ...allProps.map(p => p.name),
    ...hoisted.vars.map(v => v.name),
    ...opts.derived.map(d => d.name),
  ]);

  // — dirty bit map
  const bits = buildBitMapFromNames(
    [...allProps.map(p => p.name), ...hoisted.vars.map(v => v.name), ...opts.derived.map(d => d.name)]
  );

  // — runtime prelude
  if (opts.esm) {
    w.emit(runtimePreludeInline());
    w.emit(`let __state;`);
  } else {
    w.emit(`(function (global) {`);
    w.emit(runtimePreludeInline());
    w.emit(`  let __state;`);
  }

  // — emit blocks for roots
  const roots = ir.nodes.map((node: IRNode, i: string | number) =>
    emitNode(w, node, i, bits, 'null', 'ctx')
  );

  // — root composer
  w.emit(`
${opts.esm ? 'export ' : ''}function block_root(ctx){
  const kids = [ ${roots.join(', ')} ];
  return {
    m({parent, anchor}){ for (const k of kids) k.m({ parent, anchor }); },
    p(dirty, s){ for (const k of kids) k.p(dirty, s); },
    d(){ for (const k of kids) k.d(); }
  };
}
`);

  // — method stubs
  const methodStubs = hoisted.methods.map(m => {
    const rewritten = rewriteMethodBody(m.body, stateKeys);
    let dirtyMask = 0;
    m.deps.forEach(d => { if (stateKeys.has(d)) dirtyMask |= (bits.get(d) ?? 0); });
    const mask = dirtyMask;
    return `
  ${m.name}(){
    ${rewritten}
    ${mask ? `this._dirty |= ${mask}; this._schedule();` : ``}
  }`;
  }).join('\n');

  // — state initializer
  const seen = new Set<string>();
  const statePairs: string[] = [];

  for (const p of allProps) {
    if (!seen.has(p.name)) { statePairs.push(`${p.name}: ${p.defaultVal ?? 'undefined'}`); seen.add(p.name); }
  }
  for (const d of opts.derived) {
    if (!seen.has(d.name)) { statePairs.push(`${d.name}: undefined`); seen.add(d.name); }
  }
  for (const v of hoisted.vars) {
    if (!seen.has(v.name)) { statePairs.push(`${v.name}: ${v.init ?? 'undefined'}`); seen.add(v.name); }
  }

  // — Build CSS that will be injected into the Shadow DOM
  // If you also emit component-specific CSS, concatenate it here.
  const cssText = [STYLEBRIDGE, importantizeFontSize(remToEm(tailwindCss || ""))
  ].join("\n");  
  // (Optional) If you want a content hash for cache-busting in dev logs:
  // const cssHash = hashCss(cssText);

  // — emit the custom element shell (Shadow DOM version)
  w.emit(makeComponentShell({
    ...opts,
    props: allProps,
    esm: !!opts.esm
  }, bits, {
    statePairs,
    methodStubs,
    cssText, // <—— key change: styles go straight into the shadow root
  }));

  // — emit Tailwind hint comment so JIT can see class names when scanning built JS
  if (ir.tailwindHints && ir.tailwindHints.length) {
    const uniq = Array.from(new Set(ir.tailwindHints)).sort();
    // Keep it simple: a single-line comment is enough for Tailwind content scanners
    w.emit(`/* tailwind-safelist: ${uniq.join(' ')} */`);
  }

  // — footer for IIFE
  if (!opts.esm) {
    w.emit(`  global.ScaleJS = global.ScaleJS || {};`);
    w.emit(`  global.ScaleJS[${JSON.stringify(opts.tag)}] = { block_root };`);
    w.emit(`})(globalThis);`);
  }

  return { code: w.toString() };
}

// helper: rewrite state names to this.state.X (only if they’re state keys)
function rewriteMethodBody(body: string, stateKeys: Set<string>): string {
  const spans: Array<{kind:'code'|'s'|'d'|'t'; text:string}> = [];
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; const start = i++; let tplDepth = 0;
      while (i < body.length) {
        const c = body[i];
        if (c === '\\') { i += 2; continue; }
        if (q === '`' && c === '$' && body[i+1] === '{') { tplDepth++; i += 2; continue; }
        if (q === '`' && c === '}' && tplDepth) { tplDepth--; i++; continue; }
        if (c === q && tplDepth === 0) { i++; break; }
        i++;
      }
      spans.push({ kind: q === "'" ? 's' : q === '"' ? 'd' : 't', text: body.slice(start, i) });
    } else {
      const start = i;
      while (i < body.length) {
        const c = body[i];
        if (c === '"' || c === "'" || c === '`') break;
        i++;
      }
      spans.push({ kind: 'code', text: body.slice(start, i) });
    }
  }

  const rew = (code: string) =>
    code.replace(/(?<!\.)\b([A-Za-z_]\w*)\b(?!\s*:)/g, (m, id) =>
      stateKeys.has(id) ? `this.state.${id}` : m
    );

  return spans.map(s => s.kind === 'code' ? rew(s.text) : s.text).join('');
}

function runtimePreludeInline(){ return `
function element(n){return document.createElement(n)}
function svg_element(n){return document.createElementNS('http://www.w3.org/2000/svg', n)}
function text(d){return document.createTextNode(d)}
function comment(d){return document.createComment(d)}
function insert(p,n,a){p.insertBefore(n,a||null)}
function detach(n){if(n&&n.parentNode)n.parentNode.removeChild(n)}
function set_data(t,v){v=v==null?'':''+v;if(t.data!==v)t.data=v}

const XLINK_NS = 'http://www.w3.org/1999/xlink';
function attr(node,name,value){
  if(value==null||value===false){ node.removeAttribute(name); return; }
  if (name === 'xlink:href') {            // legacy but still around for <use>
    node.setAttributeNS(XLINK_NS, 'href', value===true?'':String(value));
    return;
  }
  node.setAttribute(name, value===true?'':String(value));
}
function listen(node,type,handler){node.addEventListener(type,handler);return()=>node.removeEventListener(type,handler)}
`; }
