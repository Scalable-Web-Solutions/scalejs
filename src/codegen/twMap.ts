    // codegen/util/twMap.ts
export function mapClassesForLightDom(
    classes: string,
    prefix = 'scale-'
  ): string {
    if (!classes) return classes;
  
    const toks = classes.trim().split(/\s+/);
  
    return toks.map(tok => {
      if (!tok) return tok;
      if (/^scale-/.test(tok)) return tok; // already mapped
      // Split variants by ":" but ignore ":" inside [...]
      const parts:string[] = [];
      let buf = '', depth = 0;
      for (let i=0;i<tok.length;i++){
        const c = tok[i];
        if (c === '[') depth++;
        if (c === ']') depth = Math.max(0, depth-1);
        if (c === ':' && depth === 0){ parts.push(buf); buf=''; }
        else buf += c;
      }
      parts.push(buf);
  
      const variants = parts.slice(0, -1);
      let util = parts[parts.length - 1];
  
      // keep leading "!" on utility
      const important = util.startsWith('!');
      if (important) util = util.slice(1);
  
      // don’t prefix non-tailwindish tokens (rudimentary guard)
      if (!util || /^scale-/.test(util) || /^[.#\[]/.test(util)) {
        const rebuilt = (important ? '!' : '') + util;
        return variants.length ? variants.join(':') + ':' + rebuilt : rebuilt;
      }
  
      // special cases Tailwind expects to be prefixed when prefix is used
      if (util === 'group' || util === 'peer') util = prefix + util;
  
      // add the prefix to the utility
      util = (important ? '!' : '') + prefix + util;
  
      return variants.length ? variants.join(':') + ':' + util : util;
    }).join(' ');
  }
  