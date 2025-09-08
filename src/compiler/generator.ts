// This one is going to be a long one, the purpose of this file is to utilize the shadow dom and gen an iife formatted file

import { Prop } from "./parser.js";

export function generateIIFE(opts: {tag: string; script: string; style: string; template: string; props: Prop[];})
{
    const { tag, style, template, props } = opts;

    // Replacing props with web safe formatting
    const htmlEsc = template.replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, p) => `\${this.state.${p}}`);
    const cssEsc = style.replace(/`/g, '\\`');

    // I have no idea what this is doing
    const observed = props.map(p => `'${toKebab(p.name)}'`).join(', ');

    // Set default prop value on build so no errors are thrown?
    const defaults = props.map(p => `  ${p.name}: ${p.defaultVal ?? 'undefined'},`).join('\n');

    // What attributes are we reading? Markdown attributes?
    const readAttrs = props.map(p => `if(this.hasAttribute('${toKebab(p.name)}')) this.state.${p.name} = coerce(this.getAttribute('${toKebab(p.name)}'));`).join('\n      ');

    // converting custom element tag to a js class name
    const clsName = toClass(tag);

    // 1) Find on:* attributes and record bindings
    const bindings: Array<{ id: string; evt: string; handler: string }> = [];

    // chat gpt fixed my shit code
    const templForEvents = htmlEsc.replace(
      /on:(\w+)=["']([^"']+)["']/g,
      (_m, evt, handler) => {
        const id = `sws-${Math.random().toString(36).slice(2, 8)}`;
        bindings.push({ id, evt, handler });
        return `data-sws="${id}"`;
      }
    );

    // ty again gpt
    const accessors = props.map(p => {
    const attr = toKebab(p.name);
    return `
    get ${p.name}(){ return this.state.${p.name}; }
    set ${p.name}(v){
      const nv = v;
      if (this.state.${p.name} === nv) return;
      this.state.${p.name} = nv;
      // reflect prop -> attribute unless we're in the middle of attr -> prop
      if (!this._updatingFromAttribute) this._reflect('${attr}', nv);
      if (this.isConnected) this.render();
    }`;
    }).join('\n');

    // Thanks to chatgpt we have a working shadow dom component template
    return `(function(){
  class ${clsName} extends HTMLElement {
    static get observedAttributes(){ return [${observed}] }

    constructor(){
      super();
      // decide render root ONCE (light-dom opt-in)
      this._root = this.hasAttribute('light-dom') ? this : this.attachShadow({ mode: 'open' });
      this._updatingFromAttribute = false; // loop guard
      this.state = {
${defaults}
      };
    }

${accessors}

    connectedCallback(){
      this.readInitialProps();
      this.render();
    }

    attributeChangedCallback(name, _oldV, newV){
      // attr -> prop (guard to avoid reflecting right back)
      const key = kebabToCamel(name);
      this._updatingFromAttribute = true;
      this.state[key] = coerce(newV);
      // Also keep the JS property in sync so external code sees updated value
      // (uses setter logic but with guard active → won't reflect back)
      this[key] = this.state[key];
      this._updatingFromAttribute = false;
      if (this.isConnected) this.render();
    }

    readInitialProps(){
      ${readAttrs}
    }

    // reflect prop -> attribute (booleans/numbers handled)
    _reflect(attr, v){
      // null/undefined/false -> remove
      if (v === null || v === undefined || v === false) {
        if (this.hasAttribute(attr)) this.removeAttribute(attr);
        return;
      }
      // true -> boolean attribute (empty string); numbers/strings -> toString
      const sv = v === true ? '' : String(v);
      if (this.getAttribute(attr) !== sv) this.setAttribute(attr, sv);
    }

    render(){
      this._root.innerHTML = \`
        <style>${cssEsc}</style>
        ${templForEvents}
      \`;
${bindings.map(b => `
      // bind ${b.evt} for ${b.id}
      (() => {
        const el = this._root.querySelector('[data-sws="${b.id}"]');
        if (!el) return;
        el.addEventListener('${b.evt}', (e) => {
          ${translateHandler(b.handler)}
        });
      })();`).join('\n')}
    }
  }

  // helpers embedded in output
  function coerce(v){
    if (v === null || v === undefined) return v;
    if (v === '') return true;  // empty boolean attr
    if (v === 'true') return true;
    if (v === 'false') return false;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }
  function kebabToCamel(s){ return s.replace(/-([a-z])/g, (_,c)=>c.toUpperCase()); }
  function toKebab(s){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }
  function toClass(tag){ return tag.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(''); }

  if (!customElements.get('${tag}')) customElements.define('${tag}', ${clsName});
})();`;
}

function toClass(tag: string)
{
  return tag.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join('');
}
function toKebab(s: string)
{
  return s.replace(/([A-Z])/g,'-$1').toLowerCase();
}

function translateHandler(h: string){
  // Only support dispatch('name') for now
  const m = h.match(/dispatch\(['"](.+?)['"]\)/);
  if (m) {
    const ev = m[1];
    return `this.dispatchEvent(new CustomEvent("${ev}", { detail: {}, bubbles: true }));`;
  }
  return '';
}