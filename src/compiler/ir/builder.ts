import type { ASTNode, ElementNode, IRAttr, IRNode } from "../util/types.js";
import { wrapChildren, coalesceStatics } from "./utils.js";

type Ctx = {
  inScope: () => Set<string>;
  pushScope: (names: string[]) => void;
  popScope: () => void;

  splitDeps: (expr: string) => { stateDeps: string[]; localDeps: string[] };

  normEvent: (name: string) => string | null;
  getDynamicAttrExpr: (a: any) => string | null;

  collectClassesInto: (classAttr: string, target: Set<string>) => void;
  collectClassesFromExprInto: (expr: string, target: Set<string>) => void;

  addScript: (chunk: string) => void;

  coalesceStatics: (kids: (IRNode | null)[]) => IRNode[];
};

export function makeBuilder(ctx: Ctx) {
  function visit(n: ASTNode): IRNode | null {
    switch (n.kind) {
      case "Text":
        if (!n.value || /^\s*$/.test(n.value)) return null;
        return { k: "staticText", value: n.value };

      case "Mustache": {
        const { stateDeps, localDeps } = ctx.splitDeps(n.expr);
        return { k: "text", expr: n.expr, stateDeps, localDeps };
      }

      case "Element": {
        const tagLower = n.tag.toLowerCase();

        if (tagLower === "script") {
          for (const c of n.children) if (c.kind === "Text") ctx.addScript(c.value);
          return null;
        }

        const attrs: IRAttr[] = [];
        const on: { evt: string; handler: string; stateDeps: string[]; localDeps: string[] }[] = [];

        // per-element (build-time) hints, not merged into runtime attrs
        const tailwindHints = new Set<string>();

        for (const a of n.attrs) {
          // events
          const evt = ctx.normEvent(a.name);
          if (evt) {
            let handler = "";
            const dynamicExpr = ctx.getDynamicAttrExpr(a);
            if (dynamicExpr) {
              handler = dynamicExpr.startsWith("{") && dynamicExpr.endsWith("}")
                ? dynamicExpr.slice(1, -1).trim()
                : dynamicExpr;

              // bare identifier => call with ev
              if (handler && !handler.includes("(") && !handler.includes("=>")) {
                const isIdent = /^[A-Za-z_][A-Za-z0-9_]*$/.test(handler.trim());
                if (isIdent) handler = `${handler}(ev)`;
              }
            } else if (a.value === true || a.value == null) {
              handler = `${evt}()`;
            } else if (typeof a.value === "string") {
              handler = a.value.trim();
            }
            const { stateDeps, localDeps } = ctx.splitDeps(handler);
            on.push({ evt, handler, stateDeps, localDeps });
            continue;
          }

          // boolean attrs
          if (a.value === true) {
            attrs.push({ kind: "static", name: a.name, value: true });
            continue;
          }

          // dynamic expressions
          const expr = ctx.getDynamicAttrExpr(a);
          if (expr != null) {
            const { stateDeps, localDeps } = ctx.splitDeps(expr);
            if (a.name === "class" || a.name === "className") {
              ctx.collectClassesFromExprInto(expr, tailwindHints);
            }
            attrs.push({ kind: "dynamic", name: a.name, expr, stateDeps, localDeps });
            continue;
          }

          // static string/number
          const val = String(a.value ?? "");
          if (a.name === "class" || a.name === "className") {
            ctx.collectClassesInto(val, tailwindHints);
          }
          attrs.push({ kind: "static", name: a.name, value: val });
        }

        return {
          k: "elem",
          tag: n.tag,
          attrs,
          on,
          children: ctx.coalesceStatics(n.children.map(visit).filter(Boolean) as IRNode[]),
        };
      }

      case "IfBlock": {
        const branches = n.branches.map(br => {
          const { stateDeps, localDeps } = ctx.splitDeps(br.expr);
          return {
            expr: br.expr,
            stateDeps,
            localDeps,
            node: wrapChildren(br.children.map(visit).filter(Boolean) as IRNode[]),
          };
        });
        const elseNode = n.elseChildren?.length
          ? wrapChildren(n.elseChildren.map(visit).filter(Boolean) as IRNode[])
          : undefined;
        return { k: "if", branches, elseNode };
      }

      case "EachBlock": {
        const { itemName, indexName } = n;
        const { stateDeps: listStateDeps, localDeps: listLocalDeps } = ctx.splitDeps(n.listExpr);

        ctx.pushScope([itemName, ...(indexName ? [indexName] : [])]);
        const node = wrapChildren(n.children.map(visit).filter(Boolean) as IRNode[]);
        ctx.popScope();

        return {
          k: "each",
          listExpr: n.listExpr,
          listStateDeps,
          listLocalDeps,
          item: itemName,
          index: indexName,
          node,
        };
      }
    }
  }

  function build(ast: ASTNode[]) {
    return coalesceStatics(ast.map(visit).filter(Boolean) as IRNode[]);
  }

  return { build };
}