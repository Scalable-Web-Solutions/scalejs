import type { Prop } from "./parser.js"

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
}) {
  const { tag, style, template, props } = opts;

  // 0) TEXT bindings: {name} -> <sws-bind data-key="name"/>
  const templInterpolations = template.replace(
    /\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
    (_m, key) => `<sws-bind data-key="${key}"></sws-bind>`
  );

  // 1) IF transform: replace if-blocks with <sws-if data-id="ID"/> anchors, record meta
  const cond = transformConditionals(templInterpolations);

  // 2) Event pre-pass for base HTML
  const baseEvt = prepassEvents(cond.html);

  // 3) Event pre-pass per IF branch (so listeners inside branches wire on mount)
  const branchEvents: Array<Record<string, BranchEvent[]>> = cond.blocks.map(b => {
    const map: Record<string, BranchEvent[]> = {};
    for (const br of b.branches) {
      map[br.id] = prepassEvents(br.html).events;
    }
    if (b.elseBranch) map[b.elseBranch.id] = prepassEvents(b.elseBranch.html).events;
    return map;
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
      if (this.isConnected) this.updateAll();
    }`;
    })
    .join("\n");

  const clsName = toClass(tag);

  // serialize IF meta for runtime
  const ifTable = serializeIfTable(cond.blocks);
  const branchEvtTable = serializeBranchEvents(cond.blocks, branchEvents);

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
      this.__eventsByIf = ${branchEvtTable};   // events inside branches
      this._ifRuntime = new Map();             // id -> { anchor, currentKey, nodes[], localTextBindings[] }
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
        el.addEventListener('${b.evt}', (e) => { ${translateHandler(b.handler)} });
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

  // ⬇️ FIX: get the events array for THIS if/branch, then wire them
  const evtList =
    (this.__eventsByIf && this.__eventsByIf[ifId] && this.__eventsByIf[ifId][branch.id]) || [];

  for (const e of evtList) {
    const el = frag.querySelector('[data-sws="' + e.id + '"]');
    if (!el) continue;

    el.addEventListener(e.evt, (ev) => {
      // Support "dispatch('name')" handlers
      const m = typeof e.handler === 'string' && e.handler.match(/dispatch\(['"](.+?)['"]\)/);
      const type = m ? m[1] : String(e.handler);

      this.dispatchEvent(new CustomEvent(type, {
        detail: { originalEvent: ev },
        bubbles: true,
        composed: true
      }));
    });
  }

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

type BranchEvent = { id: string; evt: string; handler: string };
function prepassEvents(html: string): { html: string; events: BranchEvent[] } {
  const events: BranchEvent[] = [];
  const out = html.replace(/on:(\w+)=["']([^"']+)["']/g, (_m, evt, handler) => {
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

function serializeIfTable(blocks: IfMeta[]): string {
  return `[${blocks.map(b => `{
    id: '${b.id}',
    params: [${b.params.map(p => `'${p}'`).join(', ')}],
    branches: [${b.branches.map(br => `{
      id: '${br.id}', key: '${br.key}', expr: ${JSON.stringify(br.expr)}, html: ${JSON.stringify(prepassEvents(br.html).html)}
    }`).join(', ')}]${b.elseBranch ? `,
    elseBranch: { id: '${b.elseBranch.id}', key: 'else', html: ${JSON.stringify(prepassEvents(b.elseBranch.html).html)} }` : ``}
  }`).join(', ')}]`;
}

function serializeBranchEvents(blocks: IfMeta[], perBlock: Array<Record<string, BranchEvent[]>>): string {
  const obj: Record<string, Record<string, BranchEvent[]>> = {};
  blocks.forEach((b, i) => {
    obj[b.id] = {};
    const table = perBlock[i];
    for (const br of b.branches) obj[b.id][br.id] = table[br.id] || [];
    if (b.elseBranch) obj[b.id][b.elseBranch.id] = table[b.elseBranch.id] || [];
  });
  return JSON.stringify(obj);
}

/* ---------- small utilities used above ---------- */
function toClass(tag: string){
  return tag.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join('');
}
function toKebab(s: string){
  return s.replace(/([A-Z])/g,'-$1').toLowerCase();
}
function translateHandler(h: string){
  // Only support dispatch('name') for now
  const m = h.match(/dispatch\\(['"](.+?)['"]\\)/);
  if (m) {
    const ev = m[1];
    return `this.dispatchEvent(new CustomEvent("${ev}", { detail: {}, bubbles: true, composed: true }));`;
  }
  return '';
}
