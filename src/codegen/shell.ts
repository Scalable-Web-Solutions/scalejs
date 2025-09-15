// codegen/shell.ts
import type { CompileOptions } from "../compiler/index.js";

function pascal(s: string){ return s.replace(/(^|-)([a-z])/g, (_,$2,c)=>c.toUpperCase()); }
function camelToKebabLocal(s: string){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }

export function makeComponentShell(
  opts: CompileOptions,
  bits: Map<string,number>,
  extra: { statePairs: string[]; methodStubs: string }
){
  const className = pascal(opts.tag);
  const exportKw = opts.esm ? "export " : "";

  // Build a compact props table for runtime installation
  const propsWithMeta = opts.props.map(p => ({
    name: p.name,
    attr: camelToKebabLocal(p.name),
    bit: bits.get(p.name) ?? 0,
  }));

  const helpers = `
function kebabToCamel(s){ return s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); }
function camelToKebab(s){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }
function reflectAttr(el, attr, v){
  // Only reflect primitives to avoid ugly JSON attrs
  if (v === false || v == null) { el.removeAttribute(attr); return; }
  if (v === true) { el.setAttribute(attr, ''); return; }
  if (typeof v === 'object') return; // skip reflecting objects/arrays
  el.setAttribute(attr, String(v));
}
function coerceFromAttr(val, hint){
  if (val == null) return hint === 'boolean' ? false : null;
  if (hint === 'boolean') {
    if (val === '' || val === 'true') return true;
    if (val === 'false') return false;
    return true;
  }
  if (hint === 'number') {
    const n = Number(val); return Number.isNaN(n) ? 0 : n;
  }
  const s = String(val).trim();
  if (s[0] === '{' || s[0] === '[') { try { return JSON.parse(s); } catch {} }
  return String(val);
}
function upgradeProperty(el, prop){
  if (Object.prototype.hasOwnProperty.call(el, prop)) {
    const v = el[prop]; delete el[prop]; el[prop] = v; // re-route to accessor
  }
}
// Install generic getters/setters on the class prototype once
function installAccessors(klass, propTable){
  const proto = klass.prototype;
  for (const { name, attr, bit } of propTable) {
    if (Object.getOwnPropertyDescriptor(proto, name)) continue; // don't overwrite
    Object.defineProperty(proto, name, {
      configurable: true,
      enumerable: true,
      get(){ return this.state[name]; },
      set(v){
        if (this.state[name] === v) return;
        this.state[name] = v;
        if (!this._updatingFromAttr) reflectAttr(this, attr, v);
        // mark dirty and schedule; derived recompute happens during _flush
        this._dirty |= bit;
        this._schedule();
      }
    });
  }
}
`;

  const observed = JSON.stringify(propsWithMeta.map(p => p.attr));
  const propsJSON = JSON.stringify(propsWithMeta); // embed small metadata

  // inline derived recomputation (bit-aware)
  const derivedRecompute = opts.derived.map(d => {
    const bit = bits.get(d.name) ?? 0;
    return `
  // recompute ${d.name}
  with (this.state) {
    const nv = (${d.expr});
    if (this.state.${d.name} !== nv) {
      this.state.${d.name} = nv;
      this._dirty |= ${bit};
    }
  }`;
  }).join('\n');

  // initial attribute -> prop sync using accessors (with reflect guard)
  const initialSync = `
    this._updatingFromAttr = true;
    try {
      const observed = Reflect.get(this.constructor, 'observedAttributes') || [];
      for (const a of observed) {
        if (!this.hasAttribute(a)) continue;
        const key = a.replace(/-([a-z])/g, (_,c)=>c.toUpperCase());
        const hint = typeof this.state[key];
        this[key] = coerceFromAttr(this.getAttribute(a), hint); // hits accessor; reflect suppressed
      }
    } finally {
      this._updatingFromAttr = false;
    }`;

  const upgradeCalls = propsWithMeta.map(p => `upgradeProperty(this, ${JSON.stringify(p.name)});`).join('\n    ');

  return `
${helpers}
${exportKw}class ${className} extends HTMLElement {
  static get observedAttributes(){ return ${observed}; }

  constructor(){
    super();
    this._root = null;
    this._queued = false;
    this._dirty = 0;
    this._updatingFromAttr = false;
    this.state = { ${extra.statePairs.join(', ')} };

    // ensure pre-upgrade instance fields route into accessors
    ${upgradeCalls}
  }

${extra.methodStubs}

  attributeChangedCallback(name, _oldV, newV){
    const key = kebabToCamel(name);
    if (!(key in this.state)) return;
    const hint = typeof this.state[key];
    this._updatingFromAttr = true;
    try {
      this[key] = coerceFromAttr(newV, hint); // use accessor (reflect suppressed)
    } finally {
      this._updatingFromAttr = false;
    }
  }

  connectedCallback(){
    // optional: your env hook
    ensureTailwindInHead?.();

    ${initialSync}

    __state = this.state;
    this._root = block_root(this);
    this._root.m({ parent: this }); // light DOM

    // trigger an initial flush so derived + UI are consistent
    this._schedule();
  }

  disconnectedCallback(){
    this._root && this._root.d();
    this._root = null;
  }

  _schedule(){
    if (this._queued) return;
    this._queued = true;
    Promise.resolve().then(() => { this._queued = false; this._flush(); });
  }

  _flush(){
    // recompute derived in-place (bit marks propagate)
    ${derivedRecompute}
    const d = this._dirty; this._dirty = 0;
    __state = this.state;
    this._root && this._root.p(d, this.state);
  }
}
// Install accessors once using the embedded table
installAccessors(${className}, ${propsJSON});
customElements.define(${JSON.stringify(opts.tag)}, ${className});
`;
}
