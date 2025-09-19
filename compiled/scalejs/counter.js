(function (global) {

function element(n){return document.createElement(n)}
function text(d){return document.createTextNode(d)}
function comment(d){return document.createComment(d)}
function insert(p,n,a){p.insertBefore(n,a||null)}
function detach(n){if(n&&n.parentNode)n.parentNode.removeChild(n)}
function set_data(t,v){v=v==null?'':''+v;if(t.data!==v)t.data=v}
function attr(node,name,value){if(value==null||value===false){node.removeAttribute(name);return}node.setAttribute(name,value===true?'':String(value))}
function listen(node,type,handler){node.addEventListener(type,handler);return()=>node.removeEventListener(type,handler)}

  let __state;

function block_el_0_0_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("path");
      attr(el, "d", "m15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33l-.78-11.61zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1 -9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z");
      attr(el, "fill", "currentColor");
      attr(el, "fill-rule", "evenodd");
      
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}

function block_el_0_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("svg");
      attr(el, "class", "icon icon-cart-empty");
      attr(el, "aria-hidden", "true");
      attr(el, "focusable", "false");
      attr(el, "role", "presentation");
      attr(el, "xmlns", "http://www.w3.org/2000/svg");
      attr(el, "viewBox", "0 0 40 40");
      attr(el, "fill", "none");
      
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}

function block_txt_0_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Cart"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_1(locals, ctx){
  let el; const kids = [ block_txt_0_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "visually-hidden");
      
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}

function block_el_0(locals, ctx){
  let el; const kids = [ block_el_0_0(null, ctx), block_el_0_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("a");
      attr(el, "href", "/cart");
      attr(el, "class", "header__icon header__icon--cart link focus-inset");
      attr(el, "id", "cart-icon-bubble");
      
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}

function block_root(ctx){
  const kids = [ block_el_0(null, ctx) ];
  return {
    m({parent, anchor}){ for (const k of kids) k.m({ parent, anchor }); },
    p(dirty, s){ for (const k of kids) k.p(dirty, s); },
    d(){ for (const k of kids) k.d(); }
  };
}



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
        this._dirty |= bit; // mark dirty; derived recompute happens during _flush
        this._schedule();
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

class Counter extends HTMLElement {
  static get observedAttributes(){ return []; }
  static _cssText = "\n:host{ all:initial; display:block; box-sizing:border-box; width:100%;\n       font: normal 16px/1.5 ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, \"Noto Sans\";\n       color:#111; }\n:host *, :host *::before, :host *::after { box-sizing: inherit; }\nimg,video,canvas{ display:block; max-width:100%; height:auto; }\n\n*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:\"\"}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{ font-size: inherit !important;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{ font-size: 75% !important;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit; font-size: 100% !important;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}";
  static _sheet = null; // set at runtime when adopted via constructable stylesheet

  constructor(){
    super();
    this._root = null;
    this._shadow = this.attachShadow({ mode: 'open' }); // HARD isolation
    this._portals = null; // (optional) portal root inside shadow
    this._igBridge = null; // light-DOM mirrors (opt-in)
    this._igObserver = null;

    this._queued = false;
    this._dirty = 0;
    this._updatingFromAttr = false;
    this.state = {  };

    // ensure pre-upgrade instance fields route into accessors
    
  }



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
    // Apply component CSS inside shadow (no prefixing required)
    adoptStyles(this._shadow, this.constructor, (this.constructor)._cssText);

    
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
    }

    __state = this.state;

    // Shadow DOM mount point (your compiled tree renders here)
    const mount = document.createElement('div');
    mount.setAttribute('data-root','');
    this._shadow.appendChild(mount);

    // (optional) portals container inside shadow for modals/overlays
    const portals = document.createElement('div');
    portals.setAttribute('data-scalejs-portals','');
    this._shadow.appendChild(portals);
    this._portals = portals;

    // Mount compiled root
    this._root = block_root(mount);
    this._root.m({ parent: mount });

    // Opt-in: create a light-DOM mirror bridge if host has 'ig-bridge'
    this._igBridge = createIgBridge(this);
    if (this._igBridge) {
      // Observe external writes (attrs/text) to mirrors
      this._igObserver = new MutationObserver(() => this._syncMirrorsToState());
      this._igObserver.observe(this._igBridge.br, {
        subtree: true,
        characterData: true,
        childList: true,
        attributes: true
      });
      // Mirror ATC clicks to internal handler/event
      this._igBridge.atc.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('ig:add-to-cart', { bubbles: true }));
        // or: this._handleAddToCart?.();
      });
      // Initial push of state -> mirrors
      this._syncStateToMirrors();
    }

    // trigger an initial flush so derived + UI are consistent
    this._schedule();
  }

  disconnectedCallback(){
    this._root && this._root.d();
    this._root = null;

    if (this._igObserver) this._igObserver.disconnect();
    this._igObserver = null;

    if (this._igBridge?.br && this.contains(this._igBridge.br)) {
      try { this.removeChild(this._igBridge.br); } catch {}
    }
    this._igBridge = null;

    // Shadow nodes remain attached to shadow; garbage-collected with element
    this._portals = null;
  }

  // ===== Intelligems bridge syncs (no knowledge of their app required) =======
  _syncStateToMirrors(){
    const B = this._igBridge; if (!B) return;
    const toStr = v => (v == null ? '' : String(v));

    // Map your internal state fields to the mirrors here:
    const price    = toStr(this.state.price);
    const compare  = toStr(this.state.compareAt);
    const variant  = toStr(this.state.variantId);

    // Write both text and a data-value attr to be liberal
    B.price.textContent = price;   B.price.setAttribute('data-value', price);
    B.compare.textContent = compare; B.compare.setAttribute('data-value', compare);
    B.variant.textContent = variant; B.variant.setAttribute('data-value', variant);
  }

  _syncMirrorsToState(){
    const B = this._igBridge; if (!B) return;
    const val = (el) => el.getAttribute('data-value') ?? el.textContent ?? '';
    const maybeNum = (x) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : (x === '' ? null : x);
    };

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
    Promise.resolve().then(() => { this._queued = false; this._flush(); });
  }

  _flush(){
    // recompute derived in-place (bit marks propagate)
    
    const d = this._dirty; this._dirty = 0;
    __state = this.state;
    this._root && this._root.p(d, this.state);

    // keep mirrors up-to-date if enabled
    if (this._igBridge) this._syncStateToMirrors();
  }
}
// Install accessors once using the embedded table
installAccessors(Counter, []);
customElements.define("counter", Counter);

  global.ScaleJS = global.ScaleJS || {};
  global.ScaleJS["counter"] = { block_root };
})(globalThis);