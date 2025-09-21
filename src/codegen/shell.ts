// codegen/shell.ts
import type { CompileOptions } from "../compiler/index.js";

function pascal(s: string){ return s.replace(/(^|-)([a-z])/g, (_,$2,c)=>c.toUpperCase()); }
function camelToKebabLocal(s: string){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }

export function makeComponentShell(
  opts: CompileOptions,
  bits: Map<string,number>,
  extra: { statePairs: string[]; methodStubs: string, cssText?: string }
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
// === Generic helpers =========================================================
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
  const reflectMap = klass._reflect || null;           // ← optional per-prop reflect
  const shouldReflect = (name) => reflectMap ? !!reflectMap[name] : true;

  for (const { name, attr, bit } of propTable) {
    if (Object.getOwnPropertyDescriptor(proto, name)) continue;
    Object.defineProperty(proto, name, {
      configurable: true,
      enumerable: true,
      get(){ return this.state[name]; },
      set(v){
        if (this.state[name] === v) return;
        this.state[name] = v;
        if (!this._updatingFromAttr && shouldReflect(name)) {
          reflectAttr(this, attr, v);
        }
        this._dirty |= bit;
        if (!this._batching) this._schedule();
      }
    });
  }
}


// === Shadow DOM style injection =============================================
// Reuses a single constructable stylesheet per component class when supported.
function adoptStyles(shadow, klass, cssText){
  if (!cssText) return;

  // Constructable Stylesheets path
  try {
    if ('adoptedStyleSheets' in Document.prototype) {
      if (!klass._sheet) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        klass._sheet = sheet;
      }
      const current = shadow.adoptedStyleSheets || [];
      if (!current.includes(klass._sheet)) {
        shadow.adoptedStyleSheets = current.concat(klass._sheet);
      }
      return;
    }
  } catch { /* fall through to <style> */ }

  // Fallback: <style> tag
  const style = document.createElement('style');
  style.setAttribute('data-scalejs-style','');
  style.textContent = cssText;
  shadow.appendChild(style);
}

// === Optional Intelligems mirror bridge (light DOM, opt-in) ==================
// Mirrors expose plain nodes/attrs under the host that external apps can read/write.
// Enable by adding the 'ig-bridge' attribute to the component tag.
function createIgBridge(host){
  const enabled = host.hasAttribute('ig-bridge');
  if (!enabled) return null;

  const br = document.createElement('div');
  br.setAttribute('data-ig-bridge','');

  // Visually hidden but NOT display:none (so scripts still see it)
  br.style.position = 'absolute';
  br.style.width = '1px';
  br.style.height = '1px';
  br.style.overflow = 'hidden';
  br.style.clipPath = 'inset(50%)';
  br.style.clip = 'rect(0 0 0 0)';
  br.style.whiteSpace = 'nowrap';

  // Liberal set of hooks (rename if you know the app's selectors)
  const price    = document.createElement('span'); price.setAttribute('data-ig-price','');
  const compare  = document.createElement('span'); compare.setAttribute('data-ig-compare-at','');
  const variant  = document.createElement('span'); variant.setAttribute('data-ig-variant-id','');
  const atc      = document.createElement('button'); atc.setAttribute('data-ig-add-to-cart','');

  br.append(price, compare, variant, atc);
  host.appendChild(br);

  return { br, price, compare, variant, atc };
}
`;

  const observed = JSON.stringify(propsWithMeta.map(p => p.attr));
  const propsJSON = JSON.stringify(propsWithMeta);
  const cssLiteral = JSON.stringify(extra.cssText ?? "");

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
  
  // === CSS scoping for Light DOM ===============================================
  function scopeCss(css, scopeSel){
    // very naive but effective:
    // 1) replace :host(...) and :host with the scopeSel
    css = css.replace(/:host\\(([^)]*)\\)/g, (_,inner) => scopeSel + inner);
    css = css.replace(/:host(?![\\w-])/g, scopeSel);
  
    // 2) For top-level rules, prefix with scopeSel
    //    This keeps "img, video, canvas{...}" inside our scope too.
    css = css.replace(/(^|\\})(\\s*)([^@{}][^{]*)\\{/g, (_, close, ws, pre) => {
      // If the pre already starts with the scope, keep it
      const trimmed = pre.trim();
      if (trimmed.startsWith(scopeSel)) return \`\${close}\${ws}\${pre}{\`;
      return \`\${close}\${ws}\${scopeSel} \${pre}{\`;
    });
  
    return css;
  }
  
  // === Style adoption (Shadow vs Light) ========================================
  // For Shadow: use adoptedStyleSheets when available, fallback <style>.
  // For Light: inject a <style> under the host with scoped selectors.
  function applyStyles({ useShadow, shadow, host, klass, cssText, scopeAttrValue }){
    if (!cssText) return;
  
    if (useShadow){
      // Shadow path (same as before)
      try {
        if ('adoptedStyleSheets' in Document.prototype) {
          if (!klass._sheet) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            klass._sheet = sheet;
          }
          const current = shadow.adoptedStyleSheets || [];
          if (!current.includes(klass._sheet)) {
            shadow.adoptedStyleSheets = current.concat(klass._sheet);
          }
          return;
        }
      } catch { /* fall through */ }
  
      const style = document.createElement('style');
      style.setAttribute('data-scalejs-style','');
      style.textContent = cssText;
      shadow.appendChild(style);
      return;
    }
  
    // Light DOM path: scope and inject once per instance
    const scopeSel = \`[data-sws="\${scopeAttrValue}"]\`;
    const scoped = scopeCss(cssText, scopeSel);
  
    // Remove any previous instance style (hot remount safety)
    const prev = host.querySelector(':scope > style[data-scalejs-style]');
    if (prev) prev.remove();
  
    const style = document.createElement('style');
    style.setAttribute('data-scalejs-style','');
    style.textContent = scoped;
    host.appendChild(style);
  }
  
  ${exportKw}class ${className} extends HTMLElement {
    static get observedAttributes(){
      // include your prop attrs, but NOT light-dom (we’ll read it on connect)
      return ${observed};
    }
    static _cssText = ${cssLiteral};
    static _sheet = null; // for Shadow adoptedStyleSheets
  
    constructor(){
      super();
  
      // Mode: Shadow by default, Light if attribute present
      this._light = this.hasAttribute('light-dom');   // ← attribute switch
      this._scopeId = \`\${this.tagName.toLowerCase()}-\${Math.random().toString(36).slice(2,8)}\`; // used in Light DOM
  
      this._root = null;
      this._shadow = this._light ? null : this.attachShadow({ mode: 'open' });
      this._portals = null;
      this._igBridge = null;
      this._igObserver = null;
  
      // In Light DOM, mark host with scope attribute
      if (this._light) this.setAttribute('data-sws', this._scopeId);

      this._hook_mount = [];
      this._hook_before = [];
      this._hook_after  = [];
      this._hook_destroy = [];
      this._mounted = false;

      this._watchers = [];
      this._debouncers = new Map();

      this._queued = false;
      this._dirty = 0;
      this._updatingFromAttr = false;
      this.state = { ${extra.statePairs.join(', ')} };

      this._batching = false;
      this._rafId = 0;
  
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

    $onMount(cb){ if (typeof cb === 'function') this._hook_mount.push(cb); }
    $beforeUpdate(cb){ if (typeof cb === 'function') this._hook_before.push(cb); }
    $afterUpdate(cb){ if (typeof cb === 'function') this._hook_after.push(cb); }
    $onDestroy(cb){
  if (typeof cb !== 'function') return () => {};
  this._hook_destroy.push(cb);
  let done = false;
  const off = () => {
    if (done) return;
    done = true;
    const i = this._hook_destroy.indexOf(cb);
    if (i >= 0) this._hook_destroy.splice(i, 1);
  };
  return off;
}


    
  
    $listen(target, type, handler, opts = {}){
  if (!target || !target.addEventListener) return () => {};

  // opts: { raf?: boolean, throttle?: number, options?: AddEventListenerOptions }
  const { raf = false, throttle = 0 } = opts;
  const baseOptions = opts.options || {};

  // Default passive for high-frequency scroll-ish events (unless explicitly set)
  const needsPassiveDefault = /^(scroll|wheel|touchmove)$/i.test(type);
  const finalOptions = (needsPassiveDefault && baseOptions.passive == null)
    ? { ...baseOptions, passive: true }
    : baseOptions;

  // Compose wrapper: throttle → raf → handler
  let lastCall = 0;
  let scheduled = false;
  let lastEv = null;
  let rafId = 0;

  const invoke = (ev) => handler.call(this, ev);

  const maybeThrottle = (fn) => {
    if (!throttle) return fn;
    return (ev) => {
      const now = performance.now();
      if (now - lastCall >= throttle) {
        lastCall = now;
        fn(ev);
      }
    };
  };

  const maybeRaf = (fn) => {
    if (!raf) return fn;
    return (ev) => {
      lastEv = ev;
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(() => {
        scheduled = false;
        fn(lastEv);
      });
    };
  };

  const wrapped = maybeThrottle(maybeRaf(invoke));

  target.addEventListener(type, wrapped, finalOptions);

  const off = () => {
    // cancel any pending rAF tick
    if (raf && rafId) { cancelAnimationFrame(rafId); rafId = 0; scheduled = false; }
    try { target.removeEventListener(type, wrapped, finalOptions); } catch {}
    if (finalOptions?.signal) {
      try { finalOptions.signal.removeEventListener('abort', abortHandler); } catch {}
    }
  };

  // Auto-cleanup when an AbortSignal is provided
  const abortHandler = () => off();
  if (finalOptions?.signal) {
    if (finalOptions.signal.aborted) { off(); }
    else { finalOptions.signal.addEventListener('abort', abortHandler, { once: true }); }
  }

  // Also clean up with component lifecycle
  this._hook_destroy.push(off);
  return off;
}


    $interval(fn, ms){
      const id = setInterval(() => fn.call(this), ms);
      const off = () => clearInterval(id);
      this._hook_destroy.push(off);
      return off;
    }

    $timeout(fn, ms){
      const id = setTimeout(() => fn.call(this), ms);
      const off = () => clearTimeout(id);
      this._hook_destroy.push(off);
      return off;
    }

    //expose bits
    static _bits = ${JSON.stringify(Object.fromEntries(bits))};

    $bindEvent(target, type, map, opts){
  return this.$listen(target, type, (ev) => {
    const patch = map.call(this, ev) || {};
    let mask = 0, touchedViaAccessor = false;

    this._batching = true;                 // ← begin batch
    for (const k in patch) {
      const next = patch[k], cur = this.state[k];
      if (cur === next) continue;
      const desc = Object.getOwnPropertyDescriptor(this.constructor.prototype, k);
      if (desc && typeof desc.set === 'function') { this[k] = next; touchedViaAccessor = true; }
      else { this.state[k] = next; mask |= (this.constructor._bits?.[k] || 0); }
    }
    this._batching = false;                // ← end batch

    if (mask) this._dirty |= mask;
    if (mask || touchedViaAccessor) this._schedule();
  }, opts);
}


$watch(keys, fn){
  const arr = Array.isArray(keys) ? keys : [keys];
  const mask = arr.reduce((m,k)=> m | (this.constructor._bits?.[k] || 0), 0);
  const w = { mask, fn };
  this._watchers.push(w);
  const off = () => {
    const i = this._watchers.indexOf(w);
    if (i >= 0) this._watchers.splice(i, 1);
  };
  this._hook_destroy.push(off);
  return off;
}

$debounce(key, fn, ms=120){
  const map = this._debouncers;
  if (map.has(key)) clearTimeout(map.get(key));
  const id = setTimeout(() => { map.delete(key); fn.call(this); }, ms);
  map.set(key, id);
  const off = () => { if (map.get(key) === id) { clearTimeout(id); map.delete(key); } };
  this._hook_destroy.push(off);
  return off;
}

    connectedCallback(){
    // re-check in case attribute was added before connect
      const desiredLight = this.hasAttribute('light-dom');
      if (desiredLight !== this._light) {
        // Simple strategy: hard remount on mode change
        this.disconnectedCallback?.();
        this._light = desiredLight;
        if (this._light && !this.hasAttribute('data-sws')) {
          this._scopeId = \`\${this.tagName.toLowerCase()}-\${Math.random().toString(36).slice(2,8)}\`;
          this.setAttribute('data-sws', this._scopeId);
        }
        if (!this._light && !this._shadow) this._shadow = this.attachShadow({ mode: 'open' });
      }
  
      // Apply component CSS
      applyStyles({
        useShadow: !this._light,
        shadow: this._shadow,
        host: this,
        klass: this.constructor,
        cssText: (this.constructor)._cssText,
        scopeAttrValue: this._scopeId
      });
  
      // Sync initial attributes to state
      ${initialSync}
  
      __state = this.state;
  
      // Mount point
      const mount = document.createElement('div');
      mount.setAttribute('data-root','');
  
      if (this._light) {
        this.appendChild(mount);
      } else {
        this._shadow.appendChild(mount);
      }
  
      // (optional) portals container
      const portals = document.createElement('div');
      portals.setAttribute('data-scalejs-portals','');
      if (this._light) this.appendChild(portals); else this._shadow.appendChild(portals);
      this._portals = portals;
  
      // Mount compiled root
      this._root = block_root(this);
      this._root.m({ parent: mount });

      // Lifecycle functions
      if (typeof this.onMount === 'function') {
        const cleanup = this.onMount.call(this);
        if (typeof cleanup === 'function') this._hook_destroy.push(cleanup);
      }

      for (const cb of this._hook_mount) {
        try {
          const ret = cb.call(this);
          if (typeof ret === 'function') this._hook_destroy.push(ret);
        } catch (e) { /* optionally log */ }
      }
      this._hook_mount.length = 0;
      this._mounted = true;
  
      // Opt-in: light-DOM mirror bridge for external tools
      this._igBridge = createIgBridge(this);
      if (this._igBridge) {
        this._igObserver = new MutationObserver(() => this._syncMirrorsToState());
        this._igObserver.observe(this._igBridge.br, {
          subtree: true,
          characterData: true,
          childList: true,
          attributes: true
        });
        this._igBridge.atc.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('ig:add-to-cart', { bubbles: true }));
        });
        this._syncStateToMirrors();
      }
  
      // initial flush
      this._schedule();
    }
  
    disconnectedCallback(){
    
      if (this._root) { this._root.d(); this._root = null; }

      if (this._rafId) cancelAnimationFrame(this._rafId), this._rafId = 0;

      if (typeof this.onDestroy === 'function') { try { this.onDestroy.call(this); } catch(e){} }
      
      for (const cb of this._hook_destroy) { try { cb.call(this); } catch(e){} }
      this._hook_destroy.length = 0;

      if (this._igObserver) this._igObserver.disconnect();
      this._igObserver = null;
  
      if (this._igBridge?.br && this.contains(this._igBridge.br)) {
        try { this.removeChild(this._igBridge.br); } catch {}
      }
      this._igBridge = null;
  
      this._portals = null;
  
      // In light mode, clean instance <style> on disconnect (optional)
      if (this._light) {
        const style = this.querySelector(':scope > style[data-scalejs-style]');
        if (style) style.remove();
      }
    }
  
    // ===== Intelligems bridge syncs (unchanged) ================================
    _syncStateToMirrors(){
      const B = this._igBridge; if (!B) return;
      const toStr = v => (v == null ? '' : String(v));
      const price    = toStr(this.state.price);
      const compare  = toStr(this.state.compareAt);
      const variant  = toStr(this.state.variantId);
      B.price.textContent = price;   B.price.setAttribute('data-value', price);
      B.compare.textContent = compare; B.compare.setAttribute('data-value', compare);
      B.variant.textContent = variant; B.variant.setAttribute('data-value', variant);
    }
  
    _syncMirrorsToState(){
      const B = this._igBridge; if (!B) return;
      const val = (el) => el.getAttribute('data-value') ?? el.textContent ?? '';
      const maybeNum = (x) => { const n = Number(x); return Number.isFinite(n) ? n : (x === '' ? null : x); };
      let dirty = 0;
      const setIf = (k, v) => { if (this.state[k] !== v) { this.state[k] = v; dirty = 1; } };
      setIf('price',     maybeNum(val(B.price)));
      setIf('compareAt', maybeNum(val(B.compare)));
      setIf('variantId', val(B.variant));
      if (dirty) this._schedule();
    }
  
    // ============================== Scheduler ==================================
    _schedule(){
      if (this._queued) return;
      this._queued = true;
      this._rafId = requestAnimationFrame(() => { this._queued = false; this._flush(); });
    }
  
    _flush(){
  ${derivedRecompute}
  const d = this._dirty; this._dirty = 0;

  if (d) {
    // BEFORE UPDATE (state changed)
    for (const cb of this._hook_before) { try { cb.call(this); } catch(e){} }
    if (typeof this.beforeUpdate === 'function') { try { this.beforeUpdate.call(this); } catch(e){} }
  }

  __state = this.state;
  this._root && this._root.p(d, this.state);
  if (this._igBridge) this._syncStateToMirrors();

  if (d) {
    // WATCHERS AFTER DOM PATCH
    const ws = this._watchers;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i];
      if (d & w.mask) { try { w.fn.call(this, d, this.state); } catch(e){} }
    }

    // AFTER UPDATE
    if (typeof this.afterUpdate === 'function') { try { this.afterUpdate.call(this); } catch(e){} }
    for (const cb of this._hook_after) { try { cb.call(this); } catch(e){} }
  }
}

  }
  
  // Install accessors once using the embedded table
  installAccessors(${className}, ${propsJSON});
  customElements.define(${JSON.stringify(opts.tag)}, ${className});
  `;
  
}