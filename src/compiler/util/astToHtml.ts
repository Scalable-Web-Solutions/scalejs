import { ASTNode, Attr } from "./types.js";

export interface ToHTMLOpts {
  mode: "literal";
  keepEmptyAttrs?: boolean;
  ignoreTags?: Set<string>;
  allowAttr?: (name: string) => boolean; // default: skip @events
}

/* ---------------- utils ---------------- */

const DEFAULT: Required<Pick<ToHTMLOpts,"mode"|"keepEmptyAttrs">> = {
  mode: "literal",
  keepEmptyAttrs: false,
};

const isEvent = (n: string) => n.startsWith("@") || n.startsWith("on:");
const isClassName = (n: string) => n === "class" || n === "className";

const escText = (s: string) =>
  s.replace(/[&<>\u00A0]/g, ch => ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : "&nbsp;");
const escAttr = (s: string) =>
  s.replace(/[&"<>\u00A0]/g, ch => ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : "&nbsp;");

const splitTokens = (s: string) => s.split(/\s+/).filter(Boolean);
const unwrapBraces = (v: string) => {
  const m = v.match(/^\{([\s\S]+)\}$/);
  return m ? m[1].trim() : null;
};
function extractClassLiterals(expr: string): string[] {
  const out: string[] = [];
  for (const m of expr.matchAll(/(['"])([^'"]*?)\1/g)) out.push(...splitTokens(m[2]));
  for (const m of expr.matchAll(/`([^`]*)`/g)) m[1].split(/\$\{[^}]+\}/g).forEach(p => out.push(...splitTokens(p)));
  return out;
}

/** Normalize an attribute value that might be a string, a node, or an array of nodes */
function normAttrParts(v: unknown): Array<{ kind: "static"|"dynamic"; text: string }> {
  const parts: Array<{kind:"static"|"dynamic";text:string}> = [];
  const pushS = (t: string) => { if (t) parts.push({kind:"static", text:t}); };
  const pushD = (e: string) => { if (e) parts.push({kind:"dynamic", text:e}); };

  if (typeof v === "string") {
    const d = unwrapBraces(v); if (d) pushD(d); else pushS(v); return parts;
  }
  if (Array.isArray(v)) {
    for (const n of v) {
      if (n && typeof n === "object" && "kind" in (n as any)) {
        const k = (n as any).kind;
        if (k === "Text") pushS(String((n as any).value ?? ""));
        else if (k === "Mustache") pushD(String((n as any).expr ?? ""));
      } else if (typeof n === "string") {
        const d = unwrapBraces(n); if (d) pushD(d); else pushS(n);
      }
    }
    return parts;
  }
  if (v && typeof v === "object" && "kind" in (v as any)) {
    const n = v as any;
    if (n.kind === "Text") pushS(String(n.value ?? ""));
    else if (n.kind === "Mustache") pushD(String(n.expr ?? ""));
    return parts;
  }
  if (v != null) pushS(String(v));
  return parts;
}

/* ---------------- main walker ---------------- */

export function astToHtml(node: ASTNode[] | ASTNode, opts: ToHTMLOpts = { mode: "literal" }): string {
  const o = { ...DEFAULT, ...opts };
  const ignore = o.ignoreTags ?? new Set<string>(["script"]);
  const allowAttr = o.allowAttr ?? ((n: string) => !isEvent(n));

  // global class token collector (safety net for Tailwind)
  const allClasses = new Set<string>();

  function collectClassesFromAttrValue(v: unknown) {
    for (const p of normAttrParts(v)) {
      if (p.kind === "static") splitTokens(p.text).forEach(c => allClasses.add(c));
      else extractClassLiterals(p.text).forEach(c => allClasses.add(c));
    }
  }

  function renderAttrs(tag: string, attrs: Attr[]): { html: string[], mergedClass?: string } {
    const staticTokens: string[] = [];
    const dynamicExprs: string[] = [];
    const directiveTokens: string[] = [];
    const rest: string[] = [];

    for (const a of attrs) {
      if (a.name.startsWith("class:")) {
        const cls = a.name.slice("class:".length);
        if (cls) { directiveTokens.push(cls); allClasses.add(cls); }
        continue;
      }
      if (isClassName(a.name)) {
        if (a.value !== true) {
          collectClassesFromAttrValue(a.value as any);
          for (const p of normAttrParts(a.value as any)) {
            if (p.kind === "static") staticTokens.push(...splitTokens(p.text));
            else dynamicExprs.push(p.text);
          }
        }
        continue; // we’ll emit one merged class later
      }
      if (!allowAttr(a.name)) continue;

      if (a.value === true) { rest.push(`${a.name}`); continue; }
      const s = String(a.value ?? "");
      const dyn = unwrapBraces(s);
      if (dyn) rest.push(`${a.name}="${escAttr(`{${dyn}}`)}"`);
      else if (s || o.keepEmptyAttrs) rest.push(`${a.name}="${escAttr(s)}"`);
    }

    // merge/dedupe & also add to global collector
    const merged = new Set<string>();
    staticTokens.forEach(t => { if (t) { merged.add(t); allClasses.add(t); } });
    directiveTokens.forEach(t => { merged.add(t); allClasses.add(t); });
    for (const e of dynamicExprs) extractClassLiterals(e).forEach(t => { merged.add(t); allClasses.add(t); });

    const attrsOut: string[] = [];
    if (merged.size > 0) attrsOut.push(`class="${escAttr([...merged].join(" "))}"`);
    attrsOut.push(...rest);
    return { html: attrsOut, mergedClass: merged.size ? [...merged].join(" ") : undefined };
  }

  function renderNode(n: any): string {
    if (!n || typeof n !== "object") return "";
    switch (n.kind) {
      case "Text": return escText(String(n.value ?? ""));
      case "Mustache": return `{${String(n.expr ?? "")}}`;

      case "Element": {
        const tag = String(n.tag);
        if (ignore.has(tag.toLowerCase())) return "";
        const { html: attrHtml } = renderAttrs(tag, Array.isArray(n.attrs) ? n.attrs : []);
        const open = attrHtml.length ? `<${tag} ${attrHtml.join(" ")}>` : `<${tag}>`;
        const kids = Array.isArray(n.children) ? n.children.map(renderNode).join("") : "";
        return `${open}${kids}</${tag}>`;
      }

      // If / IfBlock: include BOTH branches so Tailwind sees both
      case "If":
      case "IfBlock": {
        const thenNodes = n.then ?? n.consequent ?? n.children ?? [];
        const elseNodes = n.else ?? n.alternate ?? n.otherwise ?? [];
        const thenHtml = Array.isArray(thenNodes) ? thenNodes.map(renderNode).join("") : "";
        const elseHtml = Array.isArray(elseNodes) ? elseNodes.map(renderNode).join("") : "";
        return `<!-- if -->${thenHtml}${elseHtml}<!-- /if -->`;
      }

      // Each / EachBlock: render body once
      case "Each":
      case "EachBlock": {
        const body = n.children ?? n.body ?? [];
        const bodyHtml = Array.isArray(body) ? body.map(renderNode).join("") : "";
        return `<!-- each -->${bodyHtml}<!-- /each -->`;
      }

      default: {
        // Safety net: if unknown node has children, walk them
        if (Array.isArray(n.children)) return n.children.map(renderNode).join("");
        return "";
      }
    }
  }

  const html = Array.isArray(node) ? node.map(renderNode).join("") : renderNode(node);

  // SAFETY NET: if we still didn’t produce any class attributes in the HTML,
  // emit a minimal div carrying all collected tokens so Tailwind can include them.
  if (!/\bclass\s*=/.test(html) && allClasses.size > 0) {
    const extra = `<div class="${escAttr([...allClasses].join(" "))}"></div>`;
    return html + extra;
  }
  return html;
}
