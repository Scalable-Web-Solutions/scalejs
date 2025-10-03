const RESERVED = new Set(["true", "false", "null", "undefined", "this"]);

export function makeSplitDeps(inScope: () => Set<string>) {
  return function splitDeps(expr: string) {
    const state = new Set<string>(), local = new Set<string>();
    const scope = inScope();

    if (expr.startsWith("`") && expr.endsWith("`")) {
      const interpolations = expr.match(/\$\{([^}]+)\}/g) || [];
      for (const interp of interpolations) {
        const content = interp.slice(2, -1);
        const re = /[A-Za-z_][A-Za-z0-9_]*/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
          const id = m[0];
          if (RESERVED.has(id)) continue;
          (scope.has(id) ? local : state).add(id);
        }
      }
    } else {
      const re = /[A-Za-z_][A-Za-z0-9_]*/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(expr))) {
        const id = m[0];
        if (RESERVED.has(id)) continue;
        (scope.has(id) ? local : state).add(id);
      }
    }
    return { stateDeps: [...state], localDeps: [...local] };
  };
}