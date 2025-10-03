(function (global) {

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

  let __state;

function block_txt_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n  "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n    "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n      "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_attr_1_1_1_1_1_0(s, locals){ const { videoSrc } = s;  return ((videoSrc)); }

function block_el_1_1_1_1_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("video");
      attr(el, "class", "absolute inset-0 h-full w-full object-cover");
      attr(el, "autoplay", true);
      attr(el, "muted", "true");
      attr(el, "loop", "true");
      attr(el, "playsinline", "true");
      
      // NEW: apply dynamic attrs once on initial mount
      attr(el, "src", get_attr_1_1_1_1_1_0(ctx.state, null));
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      if ((dirty & 64)) {
        attr(el, "src", get_attr_1_1_1_1_1_0(state, null));
      }
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_1_3(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "absolute inset-0 bg-gradient-to-t from-black/20 to-black/0 pointer-events-none");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_1_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n      "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_1_0(null), block_el_1_1_1_1_1(null, ctx), block_txt_1_1_1_1_2(null), block_el_1_1_1_1_3(null, ctx), block_txt_1_1_1_1_4(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "relative overflow-hidden shadow-sm bg-black/5 min-h-[40vh] lg:h-screen");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n      "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_txt_1_1_1_3_1_1_0(s,locals){ const { eyebrow } = s;  return (eyebrow); }

function block_txt_1_1_1_3_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_1_1_1_3_1_1_0(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 128) set_data(t, get_txt_1_1_1_3_1_1_0(s, locals)); },
    d(){ detach(t); }
  };
}

function block_el_1_1_1_3_1_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_1_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_1_0(null), block_el_1_1_1_3_1_1(null, ctx), block_txt_1_1_1_3_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "inline-flex items-center gap-2 self-start rounded-full bg-[#99c9ff] px-3 py-1 text-xs font-semibold text-lime-900 ring-1 ring-[#d0e6ff]");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_3_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_3_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("★★★★★"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_3_1_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_3_1_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "aria-hidden", "true");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_3_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_3_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_3_1_0(null), block_el_1_1_1_3_3_1_1(null, ctx), block_txt_1_1_1_3_3_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_3_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_3_3(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "h-1 w-1 rounded-full bg-neutral-300");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_3_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_3_5_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("500+ five-star reviews"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_3_5(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_3_5_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_3_6(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_3_0(null), block_el_1_1_1_3_3_1(null, ctx), block_txt_1_1_1_3_3_2(null), block_el_1_1_1_3_3_3(null, ctx), block_txt_1_1_1_3_3_4(null), block_el_1_1_1_3_3_5(null, ctx), block_txt_1_1_1_3_3_6(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-4 flex items-center gap-3 text-sm text-neutral-600");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_5_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_txt_1_1_1_3_5_1(s,locals){ const { headline } = s;  return (headline); }

function block_txt_1_1_1_3_5_1(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_1_1_1_3_5_1(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 256) set_data(t, get_txt_1_1_1_3_5_1(s, locals)); },
    d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_5_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_5(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_5_0(null), block_txt_1_1_1_3_5_1(null), block_txt_1_1_1_3_5_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("h1");
      attr(el, "class", "mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-neutral-900");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_6(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_7_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_txt_1_1_1_3_7_1(s,locals){ const { subcopy } = s;  return (subcopy); }

function block_txt_1_1_1_3_7_1(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_1_1_1_3_7_1(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 512) set_data(t, get_txt_1_1_1_3_7_1(s, locals)); },
    d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_7_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_7(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_7_0(null), block_txt_1_1_1_3_7_1(null), block_txt_1_1_1_3_7_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("p");
      attr(el, "class", "mt-4 text-lg text-neutral-700 max-w-2xl");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_8(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_9_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_9_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_txt_1_1_1_3_9_1_1(s,locals){ const { cta } = s;  return (cta); }

function block_txt_1_1_1_3_9_1_1(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_1_1_1_3_9_1_1(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 1024) set_data(t, get_txt_1_1_1_3_9_1_1(s, locals)); },
    d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_9_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_9_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_9_1_0(null), block_txt_1_1_1_3_9_1_1(null), block_txt_1_1_1_3_9_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("a");
      attr(el, "href", "#shop");
      attr(el, "class", "inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_9_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_9(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_9_0(null), block_el_1_1_1_3_9_1(null, ctx), block_txt_1_1_1_3_9_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-6");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_10(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_11_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_11_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11_1_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-check");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_11_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            60-Day Money-Back Guarantee\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_11_1_0(null), block_el_1_1_1_3_11_1_1(null, ctx), block_txt_1_1_1_3_11_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center gap-2");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_11_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11_3(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "hidden h-1 w-1 rounded-full bg-neutral-300 sm:block");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_11_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_11_5_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11_5_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-truck");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_11_5_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            Ships in 24 Hours\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11_5(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_11_5_0(null), block_el_1_1_1_3_11_5_1(null, ctx), block_txt_1_1_1_3_11_5_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center gap-2");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_11_6(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_11(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_11_0(null), block_el_1_1_1_3_11_1(null, ctx), block_txt_1_1_1_3_11_2(null), block_el_1_1_1_3_11_3(null, ctx), block_txt_1_1_1_3_11_4(null), block_el_1_1_1_3_11_5(null, ctx), block_txt_1_1_1_3_11_6(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-700");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_12(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_1_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-medal");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_1_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Third-Party Certified"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_1_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_1_3_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_1_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_1_0(null), block_el_1_1_1_3_13_1_1(null, ctx), block_txt_1_1_1_3_13_1_2(null), block_el_1_1_1_3_13_1_3(null, ctx), block_txt_1_1_1_3_13_1_4(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_3_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-no-sugar");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_3_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_3_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Recycled Plastic"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_3_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_3_3_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_3_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_3_0(null), block_el_1_1_1_3_13_3_1(null, ctx), block_txt_1_1_1_3_13_3_2(null), block_el_1_1_1_3_13_3_3(null, ctx), block_txt_1_1_1_3_13_3_4(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_5_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_5_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-usa");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_5_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n            "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_1_1_1_3_13_5_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Made in USA"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_5_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_5_3_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_5_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13_5(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_5_0(null), block_el_1_1_1_3_13_5_1(null, ctx), block_txt_1_1_1_3_13_5_2(null), block_el_1_1_1_3_13_5_3(null, ctx), block_txt_1_1_1_3_13_5_4(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_13_6(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n        "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3_13(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_13_0(null), block_el_1_1_1_3_13_1(null, ctx), block_txt_1_1_1_3_13_2(null), block_el_1_1_1_3_13_3(null, ctx), block_txt_1_1_1_3_13_4(null), block_el_1_1_1_3_13_5(null, ctx), block_txt_1_1_1_3_13_6(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-8 grid grid-cols-3 gap-4 max-w-md");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_3_14(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n      "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1_3(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_3_0(null), block_el_1_1_1_3_1(null, ctx), block_txt_1_1_1_3_2(null), block_el_1_1_1_3_3(null, ctx), block_txt_1_1_1_3_4(null), block_el_1_1_1_3_5(null, ctx), block_txt_1_1_1_3_6(null), block_el_1_1_1_3_7(null, ctx), block_txt_1_1_1_3_8(null), block_el_1_1_1_3_9(null, ctx), block_txt_1_1_1_3_10(null), block_el_1_1_1_3_11(null, ctx), block_txt_1_1_1_3_12(null), block_el_1_1_1_3_13(null, ctx), block_txt_1_1_1_3_14(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col justify-center p-5");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_1_4(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n    "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1_1_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_1_0(null), block_el_1_1_1_1(null, ctx), block_txt_1_1_1_2(null), block_el_1_1_1_3(null, ctx), block_txt_1_1_1_4(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 lg:gap-10");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n  "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}
function get_attr_1_1_0(s, locals){ const { testStyle } = s;  return ((`${testStyle}`)); }

function block_el_1_1(locals, ctx){
  let el; const kids = [ block_txt_1_1_0(null), block_el_1_1_1(null, ctx), block_txt_1_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      
      
      // NEW: apply dynamic attrs once on initial mount
      attr(el, "class", get_attr_1_1_0(ctx.state, null));
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      if ((dirty & 2048)) {
        attr(el, "class", get_attr_1_1_0(state, null));
      }
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_1_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_1(locals, ctx){
  let el; const kids = [ block_txt_1_0(null), block_el_1_1(null, ctx), block_txt_1_2(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("section");
      attr(el, "id", "sws-h");
      attr(el, "class", "relative w-full h-screen bg-neutral-100");
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_txt_2(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n\r\n"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_txt_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("\r\n"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_3(locals, ctx){
  let el; const kids = [ block_txt_3_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("style");
      
      
      // NEW: apply dynamic attrs once on initial mount
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty,state){ 
      
      for (const k of kids) k.p(dirty,state); 
    },
    d(){ for (const off of offs) off(); for (const k of kids) k.d(); detach(el); }
  };
}

function block_root(ctx){
  const kids = [ block_txt_0(null), block_el_1(null, ctx), block_txt_2(null), block_el_3(null, ctx) ];
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
  const olds = shadow.querySelectorAll('style[data-scalejs-style]');
olds.forEach(n => n.remove());

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

  
  // HMR disabled in non-ESM/IIFE build
  const __DEV__ = false;
  const __SWS_HMR__ = null;
  const __sws_track = () => {};
  const __sws_untrack = () => {};
  const __sws_hmr_replace = () => {};


  
  // === CSS scoping for Light DOM ===============================================
  function scopeCss(css, scopeSel){
    // very naive but effective:
    // 1) replace :host(...) and :host with the scopeSel
    css = css.replace(/:host\(([^)]*)\)/g, (_,inner) => scopeSel + inner);
    css = css.replace(/:host(?![\w-])/g, scopeSel);
  
    // 2) For top-level rules, prefix with scopeSel
    //    This keeps "img, video, canvas{...}" inside our scope too.
    css = css.replace(/(^|\})(\s*)([^@{}][^{]*)\{/g, (_, close, ws, pre) => {
      // If the pre already starts with the scope, keep it
      const trimmed = pre.trim();
      if (trimmed.startsWith(scopeSel)) return `${close}${ws}${pre}{`;
      return `${close}${ws}${scopeSel} ${pre}{`;
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
    const scopeSel = `[data-sws="${scopeAttrValue}"]`;
    const scoped = scopeCss(cssText, scopeSel);
  
    // Remove any previous instance style (hot remount safety)
    const prev = host.querySelector(':scope > style[data-scalejs-style]');
    if (prev) prev.remove();
  
    const style = document.createElement('style');
    style.setAttribute('data-scalejs-style','');
    style.textContent = scoped;
    host.appendChild(style);
  }
  
  class SwsHero extends HTMLElement {
    static get observedAttributes(){
      // include your prop attrs, but NOT light-dom (we’ll read it on connect)
      return ["video-src","eyebrow","headline","subcopy","cta","test-style"];
    }
    static _cssText = "\n:host{ all:initial; display:block; box-sizing:border-box; width:100%; font-family: var(--font-h1--family); }\n:host *, :host *::before, :host *::after { box-sizing: inherit; }\nimg,video,canvas{ display:block; max-width:100%; height:auto; }\n\n*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:\"\"}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{ font-size: inherit !important;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{ font-size: 75% !important;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit; font-size: 100% !important;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.pointer-events-none{pointer-events:none}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0}.mt-4{margin-top:1em}.mt-6{margin-top:1.5em}.mt-8{margin-top:2em}.flex{display:flex}.inline-flex{display:inline-flex}.grid{display:grid}.hidden{display:none}.h-1{height:.25em}.h-full{height:100%}.h-screen{height:100vh}.min-h-\\[40vh\\]{min-height:40vh}.w-1{width:.25em}.w-full{width:100%}.max-w-2xl{max-width:42em}.max-w-md{max-width:28em}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.items-stretch{align-items:stretch}.justify-center{justify-content:center}.gap-2{gap:.5em}.gap-3{gap:.75em}.gap-4{gap:1em}.gap-6{gap:1.5em}.gap-x-6{-moz-column-gap:1.5em;column-gap:1.5em}.gap-y-2{row-gap:.5em}.self-start{align-self:flex-start}.overflow-hidden{overflow:hidden}.rounded-2xl{border-radius:1em}.rounded-full{border-radius:9999px}.rounded-xl{border-radius:.75em}.border{border-width:1px}.border-neutral-200{--tw-border-opacity:1;border-color:rgb(229 229 229/var(--tw-border-opacity,1))}.bg-\\[\\#99c9ff\\]{--tw-bg-opacity:1;background-color:rgb(153 201 255/var(--tw-bg-opacity,1))}.bg-black\\/5{background-color:rgba(0,0,0,.05)}.bg-neutral-100{--tw-bg-opacity:1;background-color:rgb(245 245 245/var(--tw-bg-opacity,1))}.bg-neutral-300{--tw-bg-opacity:1;background-color:rgb(212 212 212/var(--tw-bg-opacity,1))}.bg-neutral-900{--tw-bg-opacity:1;background-color:rgb(23 23 23/var(--tw-bg-opacity,1))}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.bg-gradient-to-t{background-image:linear-gradient(to top,var(--tw-gradient-stops))}.from-black\\/20{--tw-gradient-from:rgba(0,0,0,.2) var(--tw-gradient-from-position);--tw-gradient-to:transparent var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-black\\/0{--tw-gradient-to:transparent var(--tw-gradient-to-position)}.object-cover{-o-object-fit:cover;object-fit:cover}.p-4{padding:1em}.p-5{padding:1.25em}.px-3{padding-left:.75em;padding-right:.75em}.px-6{padding-left:1.5em;padding-right:1.5em}.py-1{padding-top:.25em;padding-bottom:.25em}.py-3{padding-top:.75em;padding-bottom:.75em}.text-center{text-align:center}.text-4xl{ font-size: 2.25em !important;line-height:2.5em}.text-base{ font-size: 1em !important;line-height:1.5em}.text-lg{ font-size: 1.125em !important;line-height:1.75em}.text-sm{ font-size: .875em !important;line-height:1.25em}.text-xs{ font-size: .75em !important;line-height:1em}.font-extrabold{font-weight:800}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-\\[1\\.05\\]{line-height:1.05}.tracking-tight{letter-spacing:-.025em}.text-lime-900{--tw-text-opacity:1;color:rgb(54 83 20/var(--tw-text-opacity,1))}.text-neutral-600{--tw-text-opacity:1;color:rgb(82 82 82/var(--tw-text-opacity,1))}.text-neutral-700{--tw-text-opacity:1;color:rgb(64 64 64/var(--tw-text-opacity,1))}.text-neutral-900{--tw-text-opacity:1;color:rgb(23 23 23/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.ring-1{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.ring-\\[\\#d0e6ff\\]{--tw-ring-opacity:1;--tw-ring-color:rgb(208 230 255/var(--tw-ring-opacity,1))}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.hover\\:bg-neutral-800:hover{--tw-bg-opacity:1;background-color:rgb(38 38 38/var(--tw-bg-opacity,1))}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus-visible\\:ring-2:focus-visible{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus-visible\\:ring-neutral-400:focus-visible{--tw-ring-opacity:1;--tw-ring-color:rgb(163 163 163/var(--tw-ring-opacity,1))}.active\\:scale-\\[0\\.99\\]:active{--tw-scale-x:0.99;--tw-scale-y:0.99;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@media (min-width:640px){.sm\\:block{display:block}.sm\\:text-5xl{ font-size: 3em !important;line-height:1}}@media (min-width:1024px){.lg\\:h-screen{height:100vh}.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\\:gap-10{gap:2.5em}.lg\\:text-6xl{ font-size: 3.75em !important;line-height:1}}";
    static _sheet = null; // for Shadow adoptedStyleSheets
  
    constructor(){
      super();

      if (__DEV__) __sws_track("sws-hero", this);
  
      // Mode: Shadow by default, Light if attribute present
      this._light = this.hasAttribute('light-dom');   // ← attribute switch
      this._scopeId = `${this.tagName.toLowerCase()}-${Math.random().toString(36).slice(2,8)}`; // used in Light DOM
  
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
      this.state = { videoSrc: "https://www.pexels.com/download/video/8419194/", eyebrow: "OVER 30,000 BOARDS CRAFTED", headline: "WE DO SNOWBOARDS RIGHT.", subcopy: "Recycled Plastic, Crafted Wood, and Premium Design.", cta: "SHOP NOW", testStyle: "bg-green-500" };

      this._batching = false;
      this._rafId = 0;
  
      // ensure pre-upgrade instance fields route into accessors
      upgradeProperty(this, "videoSrc");
    upgradeProperty(this, "eyebrow");
    upgradeProperty(this, "headline");
    upgradeProperty(this, "subcopy");
    upgradeProperty(this, "cta");
    upgradeProperty(this, "testStyle");
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
    static _bits = {"videoSrc":64,"eyebrow":128,"headline":256,"subcopy":512,"cta":1024,"testStyle":2048};

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
          this._scopeId = `${this.tagName.toLowerCase()}-${Math.random().toString(36).slice(2,8)}`;
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
      if (__DEV__) __sws_untrack("sws-hero", this);
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
  installAccessors(SwsHero, [{"name":"videoSrc","attr":"video-src","bit":64},{"name":"eyebrow","attr":"eyebrow","bit":128},{"name":"headline","attr":"headline","bit":256},{"name":"subcopy","attr":"subcopy","bit":512},{"name":"cta","attr":"cta","bit":1024},{"name":"testStyle","attr":"test-style","bit":2048}]);
  const __TAG__ = "sws-hero";

if (!customElements.get(__TAG__)) {
  customElements.define(__TAG__, SwsHero);
} else if (__DEV__) {
  // Dev HMR: live-patch all existing instances of this tag
  __sws_hmr_replace(__TAG__, SwsHero);
}

// Vite HMR handshake (module will re-eval on change)
  
/* tailwind-safelist: absolute active:scale-[0.99] bg-[#99c9ff] bg-black/5 bg-gradient-to-t bg-neutral-100 bg-neutral-300 bg-neutral-900 bg-white border border-neutral-200 flex flex-col flex-wrap focus-visible:ring-2 focus-visible:ring-neutral-400 focus:outline-none font-extrabold font-medium font-semibold from-black/20 gap-2 gap-3 gap-4 gap-6 gap-x-6 gap-y-2 grid grid-cols-1 grid-cols-3 h-1 h-full h-screen hidden hover:bg-neutral-800 i-check i-medal i-no-sugar i-truck i-usa inline-flex inset-0 items-center items-stretch justify-center leading-[1.05] lg:gap-10 lg:grid-cols-2 lg:h-screen lg:text-6xl max-w-2xl max-w-md min-h-[40vh] mt-4 mt-6 mt-8 object-cover overflow-hidden p-4 p-5 pointer-events-none px-3 px-6 py-1 py-3 relative ring-1 ring-[#d0e6ff] rounded-2xl rounded-full rounded-xl self-start shadow-sm sm:block sm:text-5xl testStyle text-4xl text-base text-center text-lg text-lime-900 text-neutral-600 text-neutral-700 text-neutral-900 text-sm text-white text-xs to-black/0 tracking-tight transition w-1 w-full */
  global.ScaleJS = global.ScaleJS || {};
  global.ScaleJS["sws-hero"] = { block_root };
})(globalThis);