# ScaleJS Overview

ScaleJS is a template-first language that compiles `.scale` files into standalone custom elements. The compiler walks your markup, extracts state from an optional `<script>` block, and emits a self-updating web component class plus a runtime bundle. It favors HTML-centric authoring, Tailwind-friendly styling, and a predictable update cycle driven by dirty bitmasks.

## Key ideas
- Author components in plain HTML with single-brace expressions and block directives for control flow.
- Define state, props, and methods with lightweight JavaScript inside `<script>`; ScaleJS hoists them into the generated class.
- Compile-time Tailwind integration keeps your CSS scoped to the component without manual build wiring.
- Output is a real custom element (Shadow DOM by default) with optional Light DOM and Shopify Liquid support.

## From `.scale` to web component
1. Write a `.scale` file that contains markup, optional `<script>`, and optional `<style>`.
2. `scalejs` CLI parses the template, translates it into a render IR, and runs Tailwind against the collected class names.
3. Code generation emits a custom element shell plus DOM block functions. State access is rewritten to `this.state.*` and instrumented with dirty flags.
4. The compiler writes the JavaScript module (and optionally a Liquid section) to your target directory.

The generated element exposes prop accessors, lifecycle hooks, and helper utilities documented in the other guides.

## Hello world example
```scale
<script>
  export let name = "Scale";
  function greet() {
    console.log(`Hello, ${name}!`);
  }
</script>

<section class="p-6 text-center">
  <h1 class="text-3xl font-bold">Hello {name}!</h1>
  <button class="mt-4 px-4 py-2 bg-neutral-900 text-white rounded" @click="greet()">
    Log greeting
  </button>
</section>
```

Save the file as `components/hello.scale`, then run:

```bash
npx scalejs build components/hello.scale --out dist/hello.js --tag scale-hello
```

The command writes a UMD-style bundle that defines `<scale-hello>` and injects component-scoped CSS. You can drop the script on any page and use the element:

```html
<script src="/dist/hello.js" defer></script>
<scale-hello name="World"></scale-hello>
```

## Runtime traits
- Shadow DOM rendering is enabled by default; add `light-dom` to the element tag to render into the light DOM with attribute-based CSS scoping.
- Props reflect to attributes (with boolean/number coercion) and can be updated imperatively through element properties.
- The scheduler batches DOM work with `requestAnimationFrame`, recomputes derived state, then patches the block tree with dirty bitmasks.
- Optional `ig-bridge` attribute installs a light-DOM mirror for Intelligems and similar integrations.

Continue with the remaining guides for template syntax, state management, and tooling details.
