import type { ASTNode, RenderModule } from "../util/types.js";
import { makeBuilder } from "./builder.js";
import { makeSplitDeps } from "./deps.js";
import { collectClassesFromExprInto, collectClassesInto } from "./classes.js";
import { coalesceStatics } from "./utils.js";
import { getDynamicAttrExpr, normEvent } from "./events.js";

export function astToRenderIR(ast: ASTNode[]): RenderModule {
  // scope tracking for locals (for each-blocks)
  const localsStack: Array<Set<string>> = [new Set()];
  const inScope = () => localsStack[localsStack.length - 1];

  let script = "";

  const splitDeps = makeSplitDeps(inScope);

  const { build } = makeBuilder({
    inScope,
    pushScope(names: string[]) {
      const s = new Set(inScope());
      for (const n of names) s.add(n);
      localsStack.push(s);
    },
    popScope() { localsStack.pop(); },

    collectClassesInto,
    collectClassesFromExprInto,

    normEvent,
    getDynamicAttrExpr,
    splitDeps,

    addScript(chunk: string) { script += chunk; },

    coalesceStatics,
  });

  const nodes = build(ast);

  // Tailwind JIT hints: rescan IR for potential classes from attrs/exprs
  const tw = new Set<string>();
  const visitForHints = (node: any) => {
    if (node.k === "elem") {
      for (const a of node.attrs) {
        if (a.name === "class" || a.name === "className") {
          if (a.kind === "static" && typeof a.value === "string") {
            a.value.split(/\s+/).filter(Boolean).forEach((c: string) => tw.add(c));
          } else if (a.kind === "dynamic") {
            collectClassesFromExprInto(a.expr, tw);
          }
        }
      }
      node.children.forEach(visitForHints);
    } else if (node.k === "fragment") {
      node.children.forEach(visitForHints);
    } else if (node.k === "if") {
      node.branches.forEach((b: any) => visitForHints(b.node));
      if (node.elseNode) visitForHints(node.elseNode);
    } else if (node.k === "each") {
      visitForHints(node.node);
    }
  };
  nodes.forEach(visitForHints);

  return { nodes, script, tailwindHints: [...tw] };
}