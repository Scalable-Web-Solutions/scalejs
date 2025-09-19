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
function get_attr_0_0_0_0_0_0(s, locals){ const { videoSrc } = s;  return ((videoSrc)); }

function block_el_0_0_0_0_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("video");
      attr(el, "class", "absolute inset-0 h-full w-full object-cover");
      attr(el, "autoplay", true);
      attr(el, "muted", "true");
      attr(el, "loop", "true");
      attr(el, "playsinline", "true");
      attr(el, "src", get_attr_0_0_0_0_0_0(__state, locals));
      
      insert(parent, el, anchor);
      for (const k of kids) k.m({parent: el});
    },
    p(dirty, s){
      if (dirty & 32) attr(el, "src", get_attr_0_0_0_0_0_0(s, locals));
      for (const k of kids) k.p(dirty, s);
    },
    d(){
      for (const off of offs) off();
      for (const k of kids) k.d();
      detach(el);
    }
  };
}

function block_el_0_0_0_0_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "absolute inset-0 bg-gradient-to-t from-black/20 to-black/0 pointer-events-none");
      
      
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

function block_el_0_0_0_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_0_0(null, ctx), block_el_0_0_0_0_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "relative overflow-hidden shadow-sm bg-black/5 min-h-[40vh] lg:h-screen");
      
      
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
function get_txt_0_0_0_1_0_0_0(s,locals){ const { eyebrow } = s;  return (eyebrow); }

function block_txt_0_0_0_1_0_0_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_0_0_0_1_0_0_0(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 64) set_data(t, get_txt_0_0_0_1_0_0_0(s, locals)); },
    d(){ detach(t); }
  };
}

function block_el_0_0_0_1_0_0(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_0_0_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      
      
      
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

function block_el_0_0_0_1_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_0_0(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "inline-flex items-center gap-2 self-start rounded-full bg-[#99c9ff] px-3 py-1 text-xs font-semibold text-lime-900 ring-1 ring-[#d0e6ff]");
      
      
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

function block_txt_0_0_0_1_1_0_0_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("★★★★★"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_1_0_0(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_1_0_0_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "aria-hidden", "true");
      
      
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

function block_el_0_0_0_1_1_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_1_0_0(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center");
      
      
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

function block_el_0_0_0_1_1_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "h-1 w-1 rounded-full bg-neutral-300");
      
      
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

function block_txt_0_0_0_1_1_2_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("500+ five-star reviews"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_1_2(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_1_2_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      
      
      
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

function block_el_0_0_0_1_1(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_1_0(null, ctx), block_el_0_0_0_1_1_1(null, ctx), block_el_0_0_0_1_1_2(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-4 flex items-center gap-3 text-sm text-neutral-600");
      
      
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
function get_txt_0_0_0_1_2_0(s,locals){ const { headline } = s;  return (headline); }

function block_txt_0_0_0_1_2_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_0_0_0_1_2_0(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 128) set_data(t, get_txt_0_0_0_1_2_0(s, locals)); },
    d(){ detach(t); }
  };
}

function block_el_0_0_0_1_2(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_2_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("h1");
      attr(el, "class", "mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-neutral-900");
      
      
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
function get_txt_0_0_0_1_3_0(s,locals){ const { subcopy } = s;  return (subcopy); }

function block_txt_0_0_0_1_3_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_0_0_0_1_3_0(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 256) set_data(t, get_txt_0_0_0_1_3_0(s, locals)); },
    d(){ detach(t); }
  };
}

function block_el_0_0_0_1_3(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_3_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("p");
      attr(el, "class", "mt-4 text-lg text-neutral-700 max-w-2xl");
      
      
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
function get_txt_0_0_0_1_4_0_0(s,locals){ const { cta } = s;  return (cta); }

function block_txt_0_0_0_1_4_0_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text(get_txt_0_0_0_1_4_0_0(__state, locals)); insert(parent, t, anchor); },
    p(dirty,s){ if (dirty & 512) set_data(t, get_txt_0_0_0_1_4_0_0(s, locals)); },
    d(){ detach(t); }
  };
}

function block_el_0_0_0_1_4_0(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_4_0_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("a");
      attr(el, "href", "#shop");
      attr(el, "class", "inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400");
      
      
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

function block_el_0_0_0_1_4(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_4_0(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-6");
      
      
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

function block_el_0_0_0_1_5_0_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-check");
      
      
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

function block_txt_0_0_0_1_5_0_1(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("60-Day Money-Back Guarantee\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_5_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_5_0_0(null, ctx), block_txt_0_0_0_1_5_0_1(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center gap-2");
      
      
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

function block_el_0_0_0_1_5_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "hidden h-1 w-1 rounded-full bg-neutral-300 sm:block");
      
      
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

function block_el_0_0_0_1_5_2_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-truck");
      
      
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

function block_txt_0_0_0_1_5_2_1(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Ships in 24 Hours\r\n          "); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_5_2(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_5_2_0(null, ctx), block_txt_0_0_0_1_5_2_1(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex items-center gap-2");
      
      
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

function block_el_0_0_0_1_5(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_5_0(null, ctx), block_el_0_0_0_1_5_1(null, ctx), block_el_0_0_0_1_5_2(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-700");
      
      
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

function block_el_0_0_0_1_6_0_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-medal");
      
      
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

function block_txt_0_0_0_1_6_0_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Third-Party Certified"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_6_0_1(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_6_0_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      
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

function block_el_0_0_0_1_6_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_6_0_0(null, ctx), block_el_0_0_0_1_6_0_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      
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

function block_el_0_0_0_1_6_1_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-no-sugar");
      
      
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

function block_txt_0_0_0_1_6_1_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Recycled Plastic"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_6_1_1(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_6_1_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      
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

function block_el_0_0_0_1_6_1(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_6_1_0(null, ctx), block_el_0_0_0_1_6_1_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      
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

function block_el_0_0_0_1_6_2_0(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "i-usa");
      
      
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

function block_txt_0_0_0_1_6_2_1_0(locals){
  let t;
  return {
    m({parent, anchor}) { t = text("Made in USA"); insert(parent, t, anchor); },
    p(){}, d(){ detach(t); }
  };
}

function block_el_0_0_0_1_6_2_1(locals, ctx){
  let el; const kids = [ block_txt_0_0_0_1_6_2_1_0(null) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("span");
      attr(el, "class", "text-xs font-medium text-neutral-700");
      
      
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

function block_el_0_0_0_1_6_2(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_6_2_0(null, ctx), block_el_0_0_0_1_6_2_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center");
      
      
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

function block_el_0_0_0_1_6(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_6_0(null, ctx), block_el_0_0_0_1_6_1(null, ctx), block_el_0_0_0_1_6_2(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "mt-8 grid grid-cols-3 gap-4 max-w-md");
      
      
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

function block_el_0_0_0_1(locals, ctx){
  let el; const kids = [ block_el_0_0_0_1_0(null, ctx), block_el_0_0_0_1_1(null, ctx), block_el_0_0_0_1_2(null, ctx), block_el_0_0_0_1_3(null, ctx), block_el_0_0_0_1_4(null, ctx), block_el_0_0_0_1_5(null, ctx), block_el_0_0_0_1_6(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "flex flex-col justify-center p-5");
      
      
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

function block_el_0_0_0(locals, ctx){
  let el; const kids = [ block_el_0_0_0_0(null, ctx), block_el_0_0_0_1(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("div");
      attr(el, "class", "grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 lg:gap-10");
      
      
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
      el = element("div");
      attr(el, "class", "");
      
      
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
  let el; const kids = [ block_el_0_0(null, ctx) ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("section");
      attr(el, "id", "sws-h");
      attr(el, "class", "relative w-full h-screen bg-neutral-100");
      
      
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

function block_el_1(locals, ctx){
  let el; const kids = [  ]; const offs = [];
  return {
    m({parent, anchor}) {
      el = element("style");
      
      
      
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
  const kids = [ block_el_0(null, ctx), block_el_1(null, ctx) ];
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

class Hero extends HTMLElement {
  static get observedAttributes(){ return ["video-src","eyebrow","headline","subcopy","cta"]; }
  static _cssText = "\n:host{ all:initial; display:block; box-sizing:border-box; width:100%;\n       font: normal 16px/1.5 ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, \"Noto Sans\";\n       color:#111; }\n:host *, :host *::before, :host *::after { box-sizing: inherit; }\nimg,video,canvas{ display:block; max-width:100%; height:auto; }\n\n*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:\"\"}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{ font-size: inherit !important;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{ font-size: 75% !important;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit; font-size: 100% !important;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.pointer-events-none{pointer-events:none}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0}.mt-4{margin-top:1em}.mt-6{margin-top:1.5em}.mt-8{margin-top:2em}.flex{display:flex}.inline-flex{display:inline-flex}.grid{display:grid}.hidden{display:none}.h-1{height:.25em}.h-full{height:100%}.h-screen{height:100vh}.min-h-\\[40vh\\]{min-height:40vh}.w-1{width:.25em}.w-full{width:100%}.max-w-2xl{max-width:42em}.max-w-md{max-width:28em}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.items-stretch{align-items:stretch}.justify-center{justify-content:center}.gap-2{gap:.5em}.gap-3{gap:.75em}.gap-4{gap:1em}.gap-6{gap:1.5em}.gap-x-6{-moz-column-gap:1.5em;column-gap:1.5em}.gap-y-2{row-gap:.5em}.self-start{align-self:flex-start}.overflow-hidden{overflow:hidden}.rounded-2xl{border-radius:1em}.rounded-full{border-radius:9999px}.rounded-xl{border-radius:.75em}.border{border-width:1px}.border-neutral-200{--tw-border-opacity:1;border-color:rgb(229 229 229/var(--tw-border-opacity,1))}.bg-\\[\\#99c9ff\\]{--tw-bg-opacity:1;background-color:rgb(153 201 255/var(--tw-bg-opacity,1))}.bg-black\\/5{background-color:rgba(0,0,0,.05)}.bg-neutral-100{--tw-bg-opacity:1;background-color:rgb(245 245 245/var(--tw-bg-opacity,1))}.bg-neutral-300{--tw-bg-opacity:1;background-color:rgb(212 212 212/var(--tw-bg-opacity,1))}.bg-neutral-900{--tw-bg-opacity:1;background-color:rgb(23 23 23/var(--tw-bg-opacity,1))}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.bg-gradient-to-t{background-image:linear-gradient(to top,var(--tw-gradient-stops))}.from-black\\/20{--tw-gradient-from:rgba(0,0,0,.2) var(--tw-gradient-from-position);--tw-gradient-to:transparent var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-black\\/0{--tw-gradient-to:transparent var(--tw-gradient-to-position)}.object-cover{-o-object-fit:cover;object-fit:cover}.p-4{padding:1em}.p-5{padding:1.25em}.px-3{padding-left:.75em;padding-right:.75em}.px-6{padding-left:1.5em;padding-right:1.5em}.py-1{padding-top:.25em;padding-bottom:.25em}.py-3{padding-top:.75em;padding-bottom:.75em}.text-center{text-align:center}.text-4xl{ font-size: 2.25em !important;line-height:2.5em}.text-base{ font-size: 1em !important;line-height:1.5em}.text-lg{ font-size: 1.125em !important;line-height:1.75em}.text-sm{ font-size: .875em !important;line-height:1.25em}.text-xs{ font-size: .75em !important;line-height:1em}.font-extrabold{font-weight:800}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-\\[1\\.05\\]{line-height:1.05}.tracking-tight{letter-spacing:-.025em}.text-lime-900{--tw-text-opacity:1;color:rgb(54 83 20/var(--tw-text-opacity,1))}.text-neutral-600{--tw-text-opacity:1;color:rgb(82 82 82/var(--tw-text-opacity,1))}.text-neutral-700{--tw-text-opacity:1;color:rgb(64 64 64/var(--tw-text-opacity,1))}.text-neutral-900{--tw-text-opacity:1;color:rgb(23 23 23/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.ring-1{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.ring-\\[\\#d0e6ff\\]{--tw-ring-opacity:1;--tw-ring-color:rgb(208 230 255/var(--tw-ring-opacity,1))}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.hover\\:bg-neutral-800:hover{--tw-bg-opacity:1;background-color:rgb(38 38 38/var(--tw-bg-opacity,1))}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus-visible\\:ring-2:focus-visible{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus-visible\\:ring-neutral-400:focus-visible{--tw-ring-opacity:1;--tw-ring-color:rgb(163 163 163/var(--tw-ring-opacity,1))}.active\\:scale-\\[0\\.99\\]:active{--tw-scale-x:0.99;--tw-scale-y:0.99;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@media (min-width:640px){.sm\\:block{display:block}.sm\\:text-5xl{ font-size: 3em !important;line-height:1}}@media (min-width:1024px){.lg\\:h-screen{height:100vh}.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\\:gap-10{gap:2.5em}.lg\\:text-6xl{ font-size: 3.75em !important;line-height:1}}";
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
    this.state = { videoSrc: "https://www.pexels.com/download/video/8419194/", eyebrow: "OVER 30,000 BOARDS CRAFTED", headline: "WE DO SNOWBOARDS RIGHT.", subcopy: "Recycled Plastic, Crafted Wood, and Premium Design.", cta: "SHOP NOW" };

    // ensure pre-upgrade instance fields route into accessors
    upgradeProperty(this, "videoSrc");
    upgradeProperty(this, "eyebrow");
    upgradeProperty(this, "headline");
    upgradeProperty(this, "subcopy");
    upgradeProperty(this, "cta");
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
installAccessors(Hero, [{"name":"videoSrc","attr":"video-src","bit":32},{"name":"eyebrow","attr":"eyebrow","bit":64},{"name":"headline","attr":"headline","bit":128},{"name":"subcopy","attr":"subcopy","bit":256},{"name":"cta","attr":"cta","bit":512}]);
customElements.define("hero", Hero);

  global.ScaleJS = global.ScaleJS || {};
  global.ScaleJS["hero"] = { block_root };
})(globalThis);