// codegen/hoistScript.ts
export function hoistScript(raw: string) {
  const props: Array<{name:string, defaultVal?:string}> = [];
  const vars:  Array<{name:string, init?:string}> = [];
  const methods: Array<{name:string, body:string, deps:Set<string>}> = [];

  // export let foo = 1;
  raw.replace(/export\s+let\s+([A-Za-z_]\w*)\s*(=\s*([^;]+))?;/g, (_m, name, _eq, init) => {
    props.push({ name, defaultVal: init?.trim() });
    return '';
  });

  // let foo = 1;
  raw.replace(/(^|\s)let\s+([A-Za-z_]\w*)\s*(=\s*([^;]+))?;/g, (_m, _sp, name, _eq, init) => {
    vars.push({ name, init: init?.trim() });
    return '';
  });

  // function inc(){ ... }
  raw.replace(/function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g,
    (_m, name, _args, body) => {
      const deps = new Set<string>();
      // naive dep scan (same as your collectIdents)
      body.replace(/[A-Za-z_]\w*/g, (id: string) => { deps.add(id); return id; });
      methods.push({ name, body: body.trim(), deps });
      return '';
    });

  return { props, vars, methods };
}

export type Hoisted = {
  props:   Array<{ name: string; defaultVal?: string }>; // from `export let`
  vars:    Array<{ name: string; init?: string }>;       // from `let`
  methods: Array<{ name: string; body: string; deps: Set<string> }>; // from `function`
};