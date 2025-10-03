
import { Prop } from "./types.js";

type Mode = "wc" | "liquid";

function inferSetting(p: Prop){
  const d = p.defaultVal?.trim();
  if (d === "true" || d === "false") return { type: "checkbox", default: d === "true" };
  if (d && !Number.isNaN(Number(d)))   return { type: "number",   default: Number(d) };
  return { type: "text", default: d ?? "" };
}

function escHtml(s: string){ return s.replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

export function generateLiquid(opts: {
  name: string;            // section name in schema
  tag: string;             // custom element tag
  template: string;        // raw template without <script>/<style>
  props: Prop[];
  twCss?: string;          // per-component CSS for liquid mode
  mode: Mode;              // "wc" or "liquid"
}){
  const { name, tag, template, props, twCss, mode } = opts;

  // settings from props
  const settings = props.map(p => {
    const s = inferSetting(p);
    return { id: p.name, label: p.name, ...s };
  });

  // Replace {prop} → Liquid output in liquid mode
  const liquidTpl = mode === "liquid"
    ? template.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, p) => `{{ section.settings.${p} }}`)
    : template; // wc mode keeps {prop}; attrs feed WC

  // Minimal slot support: convert <slot name="x"></slot> to block render
  const slotNames = Array.from(liquidTpl.matchAll(/<slot\s+name="([^"]+)"\s*><\/slot>/g)).map(m => m[1]);
  let body = liquidTpl;
  for (const sn of slotNames) {
    body = body.replace(
      new RegExp(`<slot\\s+name="${sn}"\\s*><\\/slot>`,"g"),
      `{% for block in section.blocks %}{% if block.type == 'slot-${sn}' %}{{ block.settings.content }}{% endif %}{% endfor %}`
    );
  }

  // Wrap in a section container with unique class for CSS scoping
  const styleTag = (mode === "liquid" && twCss)
    ? `<style>.scale-{{ section.id }} { all: initial; } ${twCss.replace(/\n/g,' ')}</style>`
    : "";

  const wcScript = (mode === "wc")
    ? `<script src="{{ '${tag}.js' | asset_url }}" defer></script>`
    : "";

  const host = (mode === "wc")
    ? `<${tag}
         class="scale-{{ section.id }}"
         ${props.map(p => `${kebab(p.name)}="{{ section.settings.${p.name} }}"`).join(' ')}
       ></${tag}>`
    : `<div class="scale-{{ section.id }}">${body}</div>`;

  const blocks = slotNames.map(sn => ({
    type: `slot-${sn}`,
    name: `Slot: ${sn}`,
    settings: [{ type: "richtext", id: "content", label: "Content" }]
  }));

  const schema = {
    name,
    settings,
    blocks,
    presets: [{ name }]
  };

  return `
${wcScript}
${styleTag}
${host}

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}`.trim();
}

function kebab(s: string){ return s.replace(/([A-Z])/g,'-$1').toLowerCase(); }
