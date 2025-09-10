import { ASTNode, EachMeta, IfMeta } from "./types.js";

let ifSeq = 0;
let eachSeq = 0;

function astToHtmlAndMeta(nodes: ASTNode[]) {
  const ifBlocks: IfMeta[] = [];
  const eachBlocks: EachMeta[] = [];

  function render(nodes: ASTNode[]): string {
    let out = '';
    for (const n of nodes) {
      switch (n.kind) {
        case 'Text':
          out += escapeHtml(n.value); // or leave raw if you already trust it
          break;
        case 'Mustache':
          out += `<sws-bind data-expr="${escapeAttr(n.expr)}"></sws-bind>`;
          break;
        case 'IfBlock': {
          const id = `if${ifSeq++}`;
          // collect branches
          const branches = n.branches.map((br, idx) => {
            const html = render(br.children);
            return {
              id: `${id}_b${idx}`,
              key: `b${idx}`,
              expr: br.expr,
              html
            };
          });
          const elseChildren = n.elseChildren?.length ? render(n.elseChildren) : undefined;
          const elseBranch = elseChildren ? { id: `${id}_else`, key:'else' as const, html: elseChildren } : undefined;

          // extract identifiers (cheap heuristic; reuse your collectIdents if you have it)
          const ids = new Set<string>();
          for (const br of n.branches) collectIdents(br.expr, ids);

          ifBlocks.push({
            id,
            params: Array.from(ids),
            branches,
            elseBranch
          });

          // replace whole IF with anchor
          out += `<sws-if data-id="${id}"></sws-if>`;
          break;
        }
        case 'EachBlock': {
          const id = `sws-each-${eachSeq++}`;
          // params: [listExpr, itemName, idxName?]
          const params = n.indexName ? [n.listExpr, n.itemName, n.indexName] : [n.listExpr, n.itemName];
          const inner = render(n.children); // NOTE: contains <sws-bind data-expr="...">
          eachBlocks.push({ id, params, items: inner });
          out += `<sws-each data-id="${id}"></sws-each>`;
          break;
        }
      }
    }
    return out;
  }

  const html = render(nodes);
  return { html, ifBlocks, eachBlocks };
}

function escapeAttr(s: string){ return s.replace(/"/g, '&quot;'); }
function escapeHtml(s: string){ return s; /* Keep same behavior as before */ }
function collectIdents(expr: string, out: Set<string>) {
  const re = /[A-Za-z_][A-Za-z0-9_]*/g; let m;
  while ((m = re.exec(expr))) out.add(m[0]);
}
