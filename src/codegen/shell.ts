// codegen/shell.ts
import type { CompileOptions } from "../compiler/index.js";

export function makeComponentShell(
  opts: CompileOptions,
  bits: Map<string,number>,
  extra: { statePairs: string[]; methodStubs: string }
){
  const className = pascal(opts.tag);
  const exportKw = opts.esm ? "export " : "";

  const propSetters = opts.props.map(p => {
    const bit = bits.get(p.name) ?? 0;
    return `
  set ${p.name}(v){
    const old = this.state.${p.name};
    if (old === v) return;
    this.state.${p.name} = v;
    this._dirty |= ${bit};
    this._schedule();
  }`;
  }).join('\n');

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

  return `
${exportKw}class ${className} extends HTMLElement {
  constructor(){
    super();
    this._root = null;
    this._queued = false;
    this._dirty = 0;
    this.state = { ${extra.statePairs.join(', ')} };
  }

${propSetters}

${extra.methodStubs}

  connectedCallback(){
    ensureTailwindInHead();
    __state = this.state;
    this._root = block_root(this);
    this._root.m({ parent: this });
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
    ${derivedRecompute}
    const d = this._dirty; this._dirty = 0;
    __state = this.state;
    this._root && this._root.p(d, this.state);
  }
}
customElements.define(${JSON.stringify(opts.tag)}, ${className});`;
}

function pascal(s: string){ return s.replace(/(^|-)([a-z])/g, (_,$2,c)=>c.toUpperCase()); }
