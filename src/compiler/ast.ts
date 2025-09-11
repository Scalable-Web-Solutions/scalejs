import { ASTNode, EachMeta, IfMeta } from "./types.js";

export function astToHtmlAndMeta(nodes: ASTNode[]) {
  let ifSeq = 0;         // reset per call
  let eachSeq = 0;       // reset per call

  const ifBlocks: IfMeta[] = [];
  const eachBlocks: EachMeta[] = [];

  function render(nodes: ASTNode[]): string {
    let out = '';
    for (const n of nodes) {
      switch (n.kind) {
        case 'Text': {
          out += escapeHtml(n.value);
          break;
        }
        case 'Mustache': {
          out += `<sws-bind data-expr="${escapeAttr(n.expr)}"></sws-bind>`;
          break;
        }
        case 'Element': {
          // Potential Error   
          const open = `<${n.tag}${renderAttrs(Object.fromEntries(n.attrs.map(a => [a.name, a.value])))}>`;
          const inner = render(n.children);
          const close = `</${n.tag}>`;
          out += open + inner + close;
          break;
        }
        case 'IfBlock': {
          const id = `if${ifSeq++}`;
          const branches = n.branches.map((br, idx) => ({
            id: `${id}_b${idx}`,
            key: `b${idx}`,
            expr: br.expr,
            html: render(br.children),
          }));
          const elseChildren = n.elseChildren?.length ? render(n.elseChildren) : undefined;
          const elseBranch = elseChildren ? { id: `${id}_else`, key: 'else' as const, html: elseChildren } : undefined;

          // collect identifiers from all branch exprs
          const ids = new Set<string>();
          for (const br of n.branches) collectIdents(br.expr, ids);

          ifBlocks.push({ id, params: Array.from(ids), branches, elseBranch });
          out += `<sws-if data-id="${id}"></sws-if>`;
          break;
        }
        case 'EachBlock': {
          const id = `sws-each-${eachSeq++}`;
          const params = n.indexName
            ? [n.listExpr, n.itemName, n.indexName]
            : [n.listExpr, n.itemName];
          const inner = render(n.children); // contains <sws-bind data-expr="...">
          eachBlocks.push({ id, params, items: inner });
          out += `<sws-each data-id="${id}"></sws-each>`;
          break;
        }
      }
    }
    return out;
  }

  function renderAttrs(attrs: Record<string, string | boolean | null | undefined>): string {
    if (!attrs) return '';
    let s = '';
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;           // skip
      if (v === true) { s += ` ${k}`; continue; }       // boolean attr
      s += ` ${k}="${escapeAttr(String(v))}"`;
    }
    return s;
  }

  const html = render(nodes);
  return { html, ifBlocks, eachBlocks };
}

/* utils */
function escapeAttr(s: string){
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function escapeHtml(s: string){ return s; /* keep as-is if upstream already safe */ }
function collectIdents(expr: string, out: Set<string>) {
  const re = /[A-Za-z_][A-Za-z0-9_]*/g; let m;
  const stop = new Set(['true','false','null','undefined','this']);
  while ((m = re.exec(expr))) if (!stop.has(m[0])) out.add(m[0]);
}
