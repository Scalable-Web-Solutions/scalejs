import type { Prop, Derived } from "./parser.js"
import { compileScriptToClass } from "./script-compiler.js";

/**
 * Node-based codegen v1 + IF blocks:
 * - {prop} → <sws-bind data-key="prop"/>
 * - on:* → data-sws="id" (event pre-pass)
 * - {#if}{:else if}{:else}{/if} compiled to <sws-if data-id="..."/> anchors,
 *   with per-branch fragments mounted/unmounted on updates.
 */
export function generateIIFE(opts: {
  tag: string;
  script: string;
  style: string;
  template: string;
  props: Prop[];
  derived: Derived[];
}) {
  const { tag, script, style, template, props, derived } = opts;

  // 0) TEXT bindings: turn {expr} into <sws-bind data-expr="expr">
  const templInterpolations = template.replace(
    /\{([^}]+)\}/g,
    (_m, expr) => `<sws-bind data-expr="${expr.trim()}"></sws-bind>`
  );


  // 1.5) EACH transform: replace each-blocks with <sws-each data-id="ID"/> anchors, record meta
  const each = transformEachLoops(templInterpolations);

  // 1) IF transform: replace if-blocks with <sws-if data-id="ID"/> anchors, record meta
  const cond = transformConditionals(each.html);

  // 2) Event pre-pass for base HTML
  const baseEvt = prepassEvents(cond.html);

  // 3) Event pre-pass per IF branch (and keep the *html* with the same IDs!)
  const branchPrepass: Array<Record<string, { html: string; events: BranchEvent[] }>> =
    cond.blocks.map(b => {
      const map: Record<string, { html: string; events: BranchEvent[] }> = {};
      for (const br of b.branches) {
        map[br.id] = prepassEvents(br.html); // { html, events } with consistent IDs
      }
    if (b.elseBranch) map[b.elseBranch.id] = prepassEvents(b.elseBranch.html);
    return map;
  });

  // Prepass Each
  const eachPrepass = each.block.map(b => {
    const pre = prepassEvents(b.items);
    return {id: b.id, params: b.params, html: pre.html, events: pre.events};
  });

  // 4) CSS escape for string literal
  const cssEsc = style.replace(/`/g, "\\`");

  // observed attributes = kebab-case props
  const observed = props.map((p) => `'${toKebab(p.name)}'`).join(", ");

  // defaults object
  const defaults = props
    .map((p) => `        ${p.name}: ${p.defaultVal ?? "undefined"},`)
    .join("\n");

  // initial attribute read
  const readAttrs = props
    .map(
      (p) =>
        `if (this.hasAttribute('${toKebab(
          p.name
        )}')) this.state.${p.name} = coerce(this.getAttribute('${toKebab(
          p.name
        )}'));`
    )
    .join("\n      ");

  // prop accessors + reflect + update
  const accessors = props
    .map((p) => {
      const attr = toKebab(p.name);
      return `
    get ${p.name}(){ return this.state.${p.name}; }
    set ${p.name}(v){
      const nv = v;
      if (this.state.${p.name} === nv) return;
      this.state.${p.name} = nv;
      if (!this._updatingFromAttribute) this._reflect('${attr}', nv);
      this._recompute(['${p.name}']);
      if (this.isConnected) this.updateAll();
    }
    `;
    })
    .join("\n");

  const exportedPropNames = props.map(p => p.name);
  const scriptOut = compileScriptToClass(opts.script || "", {exportedPropNames, allowImports: false});

  const __BRANCH_WIRING__ = compileBranchEventWiring(cond.blocks, branchPrepass, exportedPropNames, scriptOut.methodNames);
  const __EACH_WIRING_INLINE__ = compileEachInlineEventWiring(each.block, eachPrepass, exportedPropNames, scriptOut.methodNames);

  const clsName = toClass(tag);

  const stateKeySet = new Set([
  ...props.map(p => p.name),
  ...derived.map(d => d.name),
  ]);

  const destructList = [...stateKeySet].join(', ');

  const preCompileFuncEntries = derived.map(d => {
    return `${d.name}: function(state){ const { ${destructList} } = state; return (${d.expr}); }`;
  }).join(',\n  ');

  // dependency graph / chain and topological order
function topologicalOrder(ds: { name: string; deps: string[] }[]): string[] {
  const derivedNames = new Set(ds.map(d => d.name));
  const indeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  // init indegree to 0 for all derived
  for (const d of ds) indeg[d.name] = 0;

  // only add edges when dep is another derived
  for (const d of ds) {
    for (const dep of d.deps) {
      if (!derivedNames.has(dep)) continue;      // ignore props/external
      (adj[dep] ??= []).push(d.name);
      indeg[d.name] += 1;
    }
  }

  // Kahn's algorithm
  const q = Object.keys(indeg).filter(k => indeg[k] === 0);
  const out: string[] = [];

  while (q.length) {
    const x = q.shift()!;
    out.push(x);
    for (const y of adj[x] ?? []) {
      indeg[y] -= 1;
      if (indeg[y] === 0) q.push(y);
    }
  }

  // Optional: cycle guard (helpful during dev)
  if (out.length !== ds.length) {
    console.warn('[scalejs] cycle or unknown deps in derived graph:', { ds, indeg });
  }

  return out; // contains all derived, even ones with no deps
}


  const order = topologicalOrder(derived);

  // serialize IF meta for runtime
  const ifTable = serializeIfTableWithPrepass(cond.blocks, branchPrepass);

  // serialize EACH meta for runtime
  const eachTable = serializeEachTable(each.block, eachPrepass);

  return `(function(){
  class ${clsName} extends HTMLElement {
    static get observedAttributes(){ return [${observed}] }

    constructor(){
      super();
      // choose render root once (light-dom opt-in)
      this._root = this.hasAttribute('light-dom') ? this : this.attachShadow({ mode: 'open' });
      this._updatingFromAttribute = false;
      this.state = {
        ${defaults}
      };

      // styles (constructable stylesheet fallback to <style>)
      if ('adoptedStyleSheets' in this._root) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(\`${cssEsc}\`);
        this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
      } else {
        const s = document.createElement('style');
        s.textContent = \`${cssEsc}\`;
        this._root.appendChild(s);
      }


      // handles
      this._created = false;
      this._textBindings = []; // { key, node }

      // IF runtime
      this.__ifs = ${ifTable};                 // compile-time meta
      this._ifRuntime = new Map();             // id -> { anchor, currentKey, nodes[], localTextBindings[] }

      // EACH runtime
      this.__eachs = ${eachTable};                 // compile-time meta
      this._eachRuntime = new Map();             // id -> { anchor, currentKey, nodes[], localTextBindings[] }

      ${scriptOut.topLevelCode || ""}

      this.__preCompileFuncs = {${preCompileFuncEntries}};
      this.__deps = {${buildReverseDepMap(derived, stateKeySet)}};

      this.__order = [${order.map(n => `'${n}'`).join(', ')}];
    }

    ${accessors}

    connectedCallback(){
      // read attributes -> state
      this.readInitialProps();

      // first-time DOM creation
      if (!this._created) {
        this.create();
        this._created = true;
      }

      this._recompute(${[...stateKeySet].join(', ')});

      // initial paint
      this.updateAll();
    }

    attributeChangedCallback(name, _oldV, newV){
      const key = kebabToCamel(name);
      this._updatingFromAttribute = true;
      this.state[key] = coerce(newV);
      // keep JS prop in sync (guard prevents reflect loop)
      this[key] = this.state[key];
      this._updatingFromAttribute = false;
      this._recompute([key]); // ⬅️ trigger derived
      if (this.isConnected) this.updateAll();
    }

    readInitialProps(){
      ${readAttrs}
    }

    _reflect(attr, v){
      if (v === null || v === undefined || v === false) {
        if (this.hasAttribute(attr)) this.removeAttribute(attr);
        return;
      }
      const sv = v === true ? '' : String(v);
      if (this.getAttribute(attr) !== sv) this.setAttribute(attr, sv);
    }

    ${scriptOut.methodsCode}

    // ---- Node-based lifecycle ----

    create(){
      // Build a <template> so we can clone nodes once
      const tpl = document.createElement('template');
      tpl.innerHTML = \`
        ${baseEvt.html.replace(/\\`/g,'\\\\`')}
      \`;

      // Get dom to clone the node
      const dom = tpl.content;

      // Replace each <sws-bind data-key="x"> with a Text node and remember it (base only)
      dom.querySelectorAll('sws-bind').forEach((el) => {
        const key = el.getAttribute('data-key');
        const tn = document.createTextNode(this.state[key] ?? '');
        el.replaceWith(tn);
        this._textBindings.push({ key, node: tn });
      });

      // Attach event listeners ONCE (base)
      ${baseEvt.events
        .map(
          (b) => `
      (() => {
        const el = dom.querySelector('[data-sws="${b.id}"]');
        if (!el) return;
        el.addEventListener('${b.evt}', (ev) => { ${translateHandler(b.handler, exportedPropNames, scriptOut.methodNames)} });
      })();`
        )
        .join("\n")}

      // Install IF anchors: <sws-if data-id="..."> -> comment anchor + runtime entry
      dom.querySelectorAll('sws-if').forEach(el => {
        const id = el.getAttribute('data-id');
        const anchor = document.createComment('sws-if:' + id);
        el.replaceWith(anchor);
        this._ifRuntime.set(id, { anchor, currentKey: null, nodes: [], localTextBindings: [] });
      });

      // Each anchors
      dom.querySelectorAll('sws-each').forEach(el => {
        const id = el.getAttribute('data-id');
        const anchor = document.createComment('sws-each:' + id);
        el.replaceWith(anchor);
        this._eachRuntime.set(id, { anchor, nodes: [], scopes: new WeakMap() });
      });

      // Mount once
      this._root.appendChild(dom);
    }

    // Only patch text nodes that are bound to state keys
    update(){
      this.updateAll();
    }

    updateAll(){
      // 1) base text nodes
      for (const b of this._textBindings) {
        const v = this.state[b.key];
        const nv = (v === null || v === undefined) ? '' : String(v);
        if (b.node.nodeValue !== nv) b.node.nodeValue = nv;
      }

      // 2) IF blocks
      for (const meta of this.__ifs) {
        const rt = this._ifRuntime.get(meta.id);
        if (!rt) continue;
        const nextKey = evalIfBranch(meta, this.state);
        if (nextKey === rt.currentKey) continue; // no change
        // swap branch
        this._unmountIf(meta.id);
        if (nextKey) this._mountIfBranch(meta.id, nextKey);
      }

      // Each block
      for (const meta of this.__eachs) {
        this._renderEach(meta);
      }
    }

    _recompute(changedKeys){
  // no derived? nothing to do
  if (!this.__preCompileFuncs || !this.__order || !this.__deps) return false;

  // seed set with all derived depending on any changed key
  const pending = new Set();
  for (const k of changedKeys || []) {
    const hits = this.__deps[k] || [];
    for (const n of hits) pending.add(n);
  }
  if (!pending.size) return false;

  let dirty = false;

  // evaluate in topo order to respect chains
  for (const name of this.__order) {
    if (!pending.has(name)) continue;
    const fn = this.__preCompileFuncs[name];
    if (!fn) continue;
    try {
      const next = fn(this.state);
      if (this.state[name] !== next) {
        this.state[name] = next;
        dirty = true;
        // if other derived depend on this one, mark them too
        const hits = this.__deps[name] || [];
        for (const n of hits) pending.add(n);
      }
    } catch (e) {
      console.warn('[scalejs] reactive compute failed for', name, e);
    }
  }
  return dirty;
}

_renderEach(meta) {
    const rt = this._eachRuntime.get(meta.id);
    if (!rt) return;

    const [listExpr, itemName, idxName] = meta.params;
    const list = this._evalExpr(listExpr, this.state, null);
    const arr = Array.isArray(list) ? list : [];

    // unmounting previous nodes
    for (const n of rt.nodes) {
      if (n.parentNode) n.parentNode.removeChild(n);
    }
    rt.nodes = [];

    // Build template per item
    for(let i=0; i<arr.length; i++){
        const item = arr[i];
        const tpl = document.createElement('template');
        tpl.innerHTML = meta.itemHtml;
        const frag = tpl.content;

        // Eval
        const locals = { [itemName]: item, ...(idxName ? { [idxName]: i } : {}) };
        frag.querySelectorAll('sws-bind').forEach((el) => {
          const expr = el.getAttribute('data-expr');
          const val = this._evalExpr(expr, this.state, locals);
          const tn = document.createTextNode(val == null ? '' : String(val));
          el.replaceWith(tn);
        });

        ${__EACH_WIRING_INLINE__}

        // Mounting now
        const nodes = Array.from(frag.childNodes);
        rt.anchor.parentNode && rt.anchor.parentNode.insertBefore(frag, rt.anchor);
        rt.nodes.push(...nodes);
    }
  }


    _mountIfBranch(ifId, branchKey){
  const meta = this.__ifs.find(x => x.id === ifId);
  if (!meta) return;
  const rt = this._ifRuntime.get(ifId);
  if (!rt) return;

  // locate branch by key
  let branch = meta.branches.find(b => b.key === branchKey);
  if (!branch && branchKey === 'else') branch = meta.elseBranch || null;
  if (!branch) return;

  // Build fragment for this branch
  const tpl = document.createElement('template');
  tpl.innerHTML = branch.html;
  const frag = tpl.content;

  // text binds scoped to this branch
  const locals = [];
  frag.querySelectorAll('sws-bind').forEach((el) => {
    const key = el.getAttribute('data-key');
    const tn = document.createTextNode(this.state[key] ?? '');
    el.replaceWith(tn);
    locals.push({ key, node: tn });
    this._textBindings.push({ key, node: tn }); // track globally for updates
  });

  ${__BRANCH_WIRING__}

  // mount before anchor
  const nodes = Array.from(frag.childNodes);
  rt.anchor.parentNode && rt.anchor.parentNode.insertBefore(frag, rt.anchor);

  // record
  rt.currentKey = branchKey;
  rt.nodes = nodes;
  rt.localTextBindings = locals;
}


    _unmountIf(ifId){
      const rt = this._ifRuntime.get(ifId);
      if (!rt) return;
      for (const n of rt.nodes) {
        if (n.parentNode) n.parentNode.removeChild(n);
      }
      // remove local text bindings from global list
      if (rt.localTextBindings.length){
        const set = new Set(rt.localTextBindings.map(b => b.node));
        this._textBindings = this._textBindings.filter(b => !set.has(b.node));
      }
      rt.nodes = [];
      rt.localTextBindings = [];
      rt.currentKey = null;
    }
  }

  // ---- helpers in runtime scope ----
  function coerce(v){
    if (v === null || v === undefined) return v;
    if (v === '') return true;
    if (v === 'true') return true;
    if (v === 'false') return false;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }
  function kebabToCamel(s){ return s.replace(/-([a-z])/g, (_,c)=>c.toUpperCase()); }
  function toKebab(s){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }
  function toClass(tag){ return tag.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(''); }

  // Evaluate IF branch: return key of first truthy branch, or 'else', or null
  function evalIfBranch(meta, state){
    for (const br of meta.branches) {
      try {
        const fn = new Function(...meta.params, 'return !!(' + br.expr + ')');
        const args = meta.params.map(k => state[k]);
        if (fn(...args)) return br.key;
      } catch(_){}
    }
    return meta.elseBranch ? 'else' : null;
  }

  if (!customElements.get('${tag}')) customElements.define('${tag}', ${clsName});
})();`;
}

/* ---------- compile-time helpers below (stay inside generator.ts) ---------- */
/* ---------- small utilities used above ---------- */

type BranchEvent = { id: string; evt: string; handler: string };
function prepassEvents(html: string): { html: string; events: BranchEvent[] } {
  const events: BranchEvent[] = [];
  const out = html.replace(/(?:on:|@)(\w+)=["']([^"']+)["']/g, (_m, evt, handler) => {
    const id = `sws-${Math.random().toString(36).slice(2, 8)}`;
    events.push({ id, evt, handler });
    return `data-sws="${id}"`;
  });
  return { html: out, events };
}

type IfMeta = {
  id: string;
  params: string[];
  branches: Array<{ id: string; key: string; expr: string; html: string }>;
  elseBranch?: { id: string; key: 'else'; html: string };
};

type eachMeta = {
  id: string;
  params: string[];
  items: string;
}

type EachMeta = { id: string; params: string[]; items: string };

function transformEachLoops(html: string): { html: string; block: EachMeta[] } {
  const blocks: EachMeta[] = [];
  let eachSeq = 0;
  let out = html;

  // Handle multiple (non-nested) {#each} ... {/each}
  while (true) {
    const open = out.match(/\{#each\s+([^}]+)\}/);
    if (!open) break;

    const openStart = open.index!;
    const openText = open[0];
    const head = open[1].trim();
    const bodyStart = openStart + openText.length;

    const closeStart = out.indexOf('{/each}', bodyStart);
    if (closeStart < 0) {
      // unmatched; bail out to avoid infinite loop
      break;
    }

    const body = out.slice(bodyStart, closeStart);

    // Parse "list as item, index" (index optional)
    // Accept also "list as item" and a very simple fallback
    let params: string[] = [];
    const asMatch = head.match(/^(.*?)\s+as\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?$/);
    if (asMatch) {
      const list = asMatch[1].trim();
      const item = asMatch[2].trim();
      const idx  = asMatch[3]?.trim();
      params = idx ? [list, item, idx] : [list, item];
    } else {
      // Fallback: split by spaces/commas (very loose)
      params = head.split(/[,\s]+/).filter(Boolean);
    }

    const id = `sws-each-${eachSeq++}`;
    blocks.push({ id, params, items: body });

    // Replace the whole {#each ...}{/each} with a placeholder node
    const afterClose = closeStart + '{/each}'.length;
    out = out.slice(0, openStart) + `<sws-each data-id="${id}"></sws-each>` + out.slice(afterClose);
  }

  return { html: out, block: blocks };
}

// Replace {#if}{:else if}{:else}{/if} with <sws-if data-id="..."/> and collect meta
function transformConditionals(html: string): { html: string; blocks: IfMeta[] } {
  const blocks: IfMeta[] = [];
  let ifSeq = 0;

  function parse(input: string): string {
    const m = input.match(/\{#if\s+([^}]+)\}/);
    if (!m) return input;

    const start = m.index!;
    const head = m[0];
    const firstExpr = m[1].trim();
    let i = start + head.length;
    let depth = 1;

    const parts: Array<{ type:'if'|'elseif'|'else'|'end'; expr?: string; start: number; end?: number }> = [
      { type: 'if', expr: firstExpr, start: i }
    ];

    while (i < input.length && depth > 0) {
      const next = input.slice(i).match(/\{#if\s+[^}]+\}|\{:else if\s+[^}]+\}|\{:else\}|\{\/if\}/);
      if (!next) break;
      const idx = i + next.index!;
      const tok = next[0];

      if (tok.startsWith('{#if')) {
        depth++; i = idx + tok.length;
      } else if (tok.startsWith('{:else if') && depth === 1) {
        parts[parts.length - 1].end = idx;
        const expr = tok.match(/\{:else if\s+([^}]+)\}/)![1].trim();
        parts.push({ type: 'elseif', expr, start: idx + tok.length });
        i = idx + tok.length;
      } else if (tok === '{:else}' && depth === 1) {
        parts[parts.length - 1].end = idx;
        parts.push({ type: 'else', start: idx + tok.length });
        i = idx + tok.length;
      } else if (tok === '{/if}') {
        depth--;
        if (depth === 0) {
          parts[parts.length - 1].end = idx;
          i = idx + tok.length;
          break;
        }
        i = idx + tok.length;
      } else {
        i = idx + tok.length;
      }
    }

    // segments
    const segs: Array<{ kind:'if'|'elseif'|'else'; expr?:string; html:string }> = [];
    for (const p of parts) {
      const htmlSeg = input.slice(p.start, p.end);
      if (p.type === 'if' || p.type === 'elseif') {
        segs.push({ kind: p.type, expr: p.expr!, html: parse(htmlSeg) }); // recurse for nested ifs
      } else if (p.type === 'else') {
        segs.push({ kind: 'else', html: parse(htmlSeg) });
      }
    }

    const id = `if${ifSeq++}`;
    const branches = segs.filter(s => s.kind !== 'else').map((s, idx) => ({
      id: `${id}_b${idx}`,
      key: `b${idx}`,
      expr: s.expr!,
      html: s.html
    }));
    const elseBranch = segs.find(s => s.kind === 'else')
      ? { id: `${id}_else`, key: 'else' as const, html: segs.find(s => s.kind === 'else')!.html }
      : undefined;

    // collect identifiers used in branch expressions (simple heuristic)
    const ids = new Set<string>();
    for (const br of branches) collectIdents(br.expr, ids);
    const params = Array.from(ids);

    blocks.push({ id, params, branches, elseBranch });

    // replace whole IF with anchor and continue
    const out = input.slice(0, start) + `<sws-if data-id="${id}"></sws-if>` + input.slice(i);
    return parse(out);
  }

  const outHtml = parse(html);
  return { html: outHtml, blocks };
}

function collectIdents(expr: string, out: Set<string>) {
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let m;
  while ((m = re.exec(expr))) out.add(m[0]);
}

function serializeIfTableWithPrepass(
  blocks: IfMeta[],
  perBlock: Array<Record<string, { html: string; events: BranchEvent[] }>>
): string {
  return `[${blocks.map((b, i) => `{
    id: '${b.id}',
    params: [${b.params.map(p => `'${p}'`).join(', ')}],
    branches: [${b.branches.map(br => `{
      id: '${br.id}',
      key: '${br.key}',
      expr: ${JSON.stringify(br.expr)},
      html: ${JSON.stringify(perBlock[i][br.id].html)}   // reuse prepass html
    }`).join(', ')}]${
      b.elseBranch
        ? `,
    elseBranch: { id: '${b.elseBranch.id}', key: 'else', html: ${JSON.stringify(perBlock[i][b.elseBranch.id].html)} }`
        : ``
    }
  }`).join(', ')}]`;
}

function serializeEachTable(
  blocks: EachMeta[],
  prepassed: Array<{ id: string; html: string; events: BranchEvent[] }>
): string {
  const byId = new Map(prepassed.map(p => [p.id, p]));
  return `[${blocks.map(b => {
    const p = byId.get(b.id)!;
    return `{
      id: '${b.id}',
      params: [${b.params.map(x => `'${x}'`).join(', ')}],
      itemHtml: ${JSON.stringify(p.html)}
    }`;
  }).join(', ')}]`;
}

function buildReverseDepMap(
  ds: { name: string; deps: string[] }[],
  allowed: Set<string>
): string {
  const rev: Record<string, string[]> = {};
  for (const d of ds) {
    for (const dep of d.deps) {
      if (!allowed.has(dep)) continue;         // filter junk like "clicks"
      (rev[dep] ??= []).push(d.name);
    }
  }
  // stringify to inline into emitted JS
  return Object.entries(rev)
    .map(([k, arr]) => `'${k}': [${arr.map(n => `'${n}'`).join(', ')}]`)
    .join(',\n    ');
}


function toClass(tag: string){
  return tag.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join('');
}
function toKebab(s: string){
  return s.replace(/([A-Z])/g,'-$1').toLowerCase();
}
function translateHandler(h: string, stateKeys: string[], methodNames: string[]){
  const calls = h.split(';').map(s => s.trim()).filter(Boolean);
  const out: string[] = [];

  for (const c of calls) {
    // method call: foo(...args)
    const mm = c.match(/^([A-Za-z_]\w*)\s*\((.*)\)\s*$/);
    if (mm && methodNames.includes(mm[1])) {
      out.push(`this.${mm[1]}(${mm[2] || ''});`);
      continue;
    }

    // dispatch('name')
    const md = c.match(/^dispatch\(\s*['"](.+?)['"]\s*\)$/);
    if (md) {
      out.push(`this.dispatchEvent(new CustomEvent("${md[1]}", { detail:{}, bubbles:true, composed:true }));`);
      continue;
    }

    // toggle(prop)
    const mt = c.match(/^toggle\(\s*([A-Za-z_]\w*)\s*\)$/);
    if (mt) {
      out.push(`this["${mt[1]}"] = !this["${mt[1]}"];`);
      continue;
    }

    // set(prop, expr)
    const ms = c.match(/^set\(\s*([A-Za-z_]\w*)\s*,\s*(.+)\)$/);
    if (ms) {
      const prop = ms[1];
      const expr = ms[2];
      const args = stateKeys.join(', ');
      const argVals = stateKeys.map(k => `this.state.${k}`).join(', ');
      out.push(`(function(){ const __val = (function(${args}){ return (${expr}); }).call(this, ${argVals}); this["${prop}"] = __val; }).call(this);`);
      continue;
    }

    // fallback → treat as event name
    out.push(`this.dispatchEvent(new CustomEvent(String(${JSON.stringify(c)}), { detail:{}, bubbles:true, composed:true }));`);
  }

  return out.join(' ');
}

function compileBranchEventWiring(
  blocks: IfMeta[],
  perBlock: Array<Record<string, { html: string; events: BranchEvent[] }>>,
  stateKeys: string[],
  methodNames: string[]
){
  return blocks.map((b, idx) => {
    const table = perBlock[idx];
    return Object.entries(table).map(([branchId, pre]) => {
      const evts = pre.events;
      return evts.map(e => `
      if (ifId === '${b.id}' && branch.id === '${branchId}') {
        const el = frag.querySelector('[data-sws="${e.id}"]');
        if (el) el.addEventListener('${e.evt}', (ev) => { ${translateHandler(e.handler, stateKeys, methodNames)} });
      }`).join('\n');
    }).join('\n');
  }).join('\n');
}

function compileEachInlineEventWiring(
  eachBlocks: EachMeta[],
  eachPrepass: Array<{ id: string; html: string; events: BranchEvent[] }>,
  stateKeys: string[],
  methodNames: string[]
) {
  const byId = new Map(eachPrepass.map(p => [p.id, p]));
  return eachBlocks.map(b => {
    const pre = byId.get(b.id)!;
    return pre.events.map(e => {
      const selector = JSON.stringify(`[data-sws="${e.id}"]`);
      const evtType  = JSON.stringify(e.evt);
      const body     = JSON.stringify(translateHandler(e.handler, stateKeys, methodNames));
      return `
        if (eachId === '${b.id}') {
          const __el = frag.querySelector(${selector});
          if (__el) {
            const __fn    = new Function('ev','state','locals', ${body});
            const __bound = (ev) => __fn.call(this, ev, this.state, locals);
            __el.addEventListener(${evtType}, __bound);
            // TODO: store __bound for cleanup on unmount/diff
          }
        }`;
    }).join('\n');
  }).join('\n');
}
