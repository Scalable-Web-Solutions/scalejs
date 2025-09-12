// codegen/generate.ts (outline)
import { Writer } from './writer.js';
import { buildBitMap, buildBitMapFromNames, maskOf } from './bitmask.js';
import { IRNode, RenderModule } from '../compiler/types.js';
import { CompileOptions } from '../compiler/index.js';
import { emitNode } from '../emitters/frag.js';
import { makeComponentShell } from './shell.js';
import { astToRenderIR } from '../compiler/astToIR.js';
import { hoistScript } from './hoistScript.js';

// receive the Renderirule, not IRNode[]
export function generate(ir: RenderModule, opts: CompileOptions, tailwindCss: string) {
  const w = new Writer();

  // 3.1 hoist <script>
  const hoisted = ir.script ? hoistScript(ir.script) : { props: [], vars: [], methods: [] };

  // 3.2 merge CLI props with hoisted export lets (hoisted wins if both define defaults)
  const byName = new Map(opts.props.map(p => [p.name, { ...p }]));
  for (const p of hoisted.props) byName.set(p.name, { name: p.name, defaultVal: p.defaultVal });
  const allProps = [...byName.values()];

  // 3.3 state keys (props + hoisted vars + derived)
  const stateKeys = new Set<string>([
    ...allProps.map(p => p.name),
    ...hoisted.vars.map(v => v.name),
    ...opts.derived.map(d => d.name)
  ]);

  // 3.4 build bit map across everything that can be dirty
  const bits = buildBitMapFromNames(
    [...allProps.map(p => p.name), ...hoisted.vars.map(v => v.name), ...opts.derived.map(d => d.name)]
  );

  // 3.5 inline runtime / prelude (IIFE vs ESM) — unchanged except you probably switched to inline helpers
  if (opts.esm) {
    w.emit(runtimePreludeInline());
    w.emit(`let __state;`);
  } else {
    w.emit(`(function (global) {`);
    w.emit(runtimePreludeInline());
    w.emit(`  let __state;`);
  }

  // 3.6 emit blocks for roots
  const roots = ir.nodes.map((node: IRNode, i: string | number) => emitNode(w, node, i, bits, 'null', 'ctx'));

  // 3.7 root composer (no export in IIFE)
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

  // 3.8 build method stubs from hoisted `function`s
  const methodStubs = hoisted.methods.map(m => {
    // rewrite bare state identifiers to this.state.*
    const rewritten = rewriteMethodBody(m.body, stateKeys);
    // compute dirty mask from deps intersecting state keys
    let dirtyMask = 0;
    m.deps.forEach(d => { if (stateKeys.has(d)) dirtyMask |= (bits.get(d) ?? 0); });
    return `
  ${m.name}(){
    ${rewritten}
    this._dirty |= ${dirtyMask};
    this._schedule();
  }`;
  }).join('\n');

  // 3.9 state initializer: props defaults + derived (undefined) + hoisted vars
  const statePairs = [
    ...allProps.map(p => `${p.name}: ${p.defaultVal ?? 'undefined'}`),
    ...opts.derived.map(d => `${d.name}: undefined`),
    ...hoisted.vars.map(v => `${v.name}: ${v.init ?? 'undefined'}`),
  ];

    w.emit(`const TW_CSS = ${JSON.stringify(tailwindCss)};
  let __twInjected = false;
  function ensureTailwindInHead() {
  if (__twInjected) return;
  // Avoid duplicates if multiple components load
  if (!document.querySelector('style[data-scale-tw]')) {
    const st = document.createElement('style');
    st.setAttribute('data-scale-tw', '1');
    st.textContent = TW_CSS;
    document.head.appendChild(st);
  }
  __twInjected = true;
}
  `)

  // 3.10 emit the custom element shell (plain JS)
  w.emit(makeComponentShell({
    ...opts,
    esm: !!opts.esm
  }, bits, {
    statePairs,
    methodStubs
  }));

  // 3.11 footer for IIFE
  if (!opts.esm) {
    w.emit(`  global.ScaleJS = global.ScaleJS || {};`);
    w.emit(`  global.ScaleJS[${JSON.stringify(opts.tag)}] = { block_root };`);
    w.emit(`})(globalThis);`);
  }

  return { code: w.toString() };
}

// tiny helper: rewrite state names to this.state.X (only if they’re state keys)
function rewriteMethodBody(body: string, stateKeys: Set<string>): string {
  return body.replace(/\b([A-Za-z_]\w*)\b/g, (id) => stateKeys.has(id) ? `this.state.${id}` : id);
}

function runtimePreludeInline(){ return `
function element(n){return document.createElement(n)}
function text(d){return document.createTextNode(d)}
function comment(d){return document.createComment(d)}
function insert(p,n,a){p.insertBefore(n,a||null)}
function detach(n){if(n&&n.parentNode)n.parentNode.removeChild(n)}
function set_data(t,v){v=v==null?'':''+v;if(t.data!==v)t.data=v}
function attr(node,name,value){if(value==null||value===false){node.removeAttribute(name);return}node.setAttribute(name,value===true?'':String(value))}
function listen(node,type,handler){node.addEventListener(type,handler);return()=>node.removeEventListener(type,handler)}
`; }
