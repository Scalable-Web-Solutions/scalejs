# Template Syntax

ScaleJS templates are HTML-first. Everything outside `<script>` and `<style>` is treated as markup that can include dynamic expressions, control-flow blocks, and event bindings. The compiler tokenizes the template, builds an AST, and converts it into DOM block functions.

## File anatomy
- You may emit any number of top-level elements; a wrapper `<div>` is not required.
- `<script>` content is hoisted for state/method extraction (see the state guide).
- `<style>` blocks are preserved as-is; Tailwind-generated CSS is appended later in the pipeline.
- Tags such as `<script>`, `<style>`, `<code>`, and `<pre>` are treated as *raw text*. Inner content is not parsed for directives.

## Expressions
- Use single braces to interpolate JavaScript: `{user.name}`, `{price * 2}`, `{items.length ?? 0}`.
- Expressions are trimmed of surrounding whitespace. You can write `{ count > 0 ? 'yes' : 'no' }` or break long expressions across lines.
- Template literals pass through untouched, so backticks work: `{`Total: ${currency(amount)}`}`.
- Inside `each` blocks you can access loop locals (`item`, optional `index`) directly.

## Attributes
### Static vs dynamic
- A bare attribute (`disabled`) becomes a boolean true.
- Quoted strings stay static: `<input placeholder="Search" />`.
- Wrap expressions in braces to bind dynamically: `<a href={linkHref}>...</a>` or `<button disabled={saving}>...</button>`.
- Template literals are allowed in attribute values: `<div class={`text-${size}`}>`.

### Class handling
- `class` and `className` are normalized; static tokens are merged and deduplicated.
- Dynamic class expressions can return strings, arrays, or template literals. Static substrings from those expressions are harvested for Tailwind safelisting.

### Events
- Use `@event` or `on:event` to attach listeners: `<button @click="increment()">` or `<input on:input={handleInput}>`.
- When the handler expression looks like `method(args)`, the generated code calls the corresponding component method with `this` bound to the element and appends the original DOM event as the last argument.
- Any other expression is wrapped in a function and executed with `this === componentInstance`. Define methods in `<script>` when you need to mutate state so dirty flags are applied.
- Boolean event attributes (no value) call a method that matches the event name: `<form @submit>` -> calls `submit()` on the instance.

### Miscellaneous
- Attribute names can include `:` and `@`, making patterns like `aria-label`, `data-id`, `class:bg-neutral-900` valid.
- Attribute order is preserved. Unknown directives are left untouched for downstream tooling.

## Blocks and control flow
ScaleJS adopts Svelte-style block syntax:

```scale
{#if cart.items.length === 0}
  <p class="text-neutral-500">Your cart is empty.</p>
{:else if cart.items.length === 1}
  <p>One item in cart.</p>
{:else}
  <p>{cart.items.length} items ready to ship.</p>
{/if}
```

- `{:else if ...}` branches can repeat as needed.
- `{:else}` does not take a condition.
- Condition expressions are parsed as plain JavaScript and may include function calls.

Loop over data with `each` blocks:

```scale
<ul>
  {#each products as product, index}
    <li data-index={index}>
      <h3>{product.title}</h3>
      <p>{product.price}</p>
    </li>
  {/each}
</ul>
```

- The `as` clause introduces an item name plus an optional index identifier.
- Locals declared by the loop are available to all children inside the block.

## Text nodes and whitespace
- Adjacent text nodes are coalesced. Whitespace outside tags is preserved exactly as written.
- Characters that are not recognized as tokens fall back to text nodes, so you can safely embed SVG, `<slot>`, and other custom markup.

## Self-closing tags
Use `/>` to self-close elements (`<img />`, `<input />`). Void HTML tags (`<br>`, `<meta>`, etc.) do not require an explicit closing tag.

## Comments and safelists
- HTML comments throw a parse error currently.

Reference the state guide for how expressions resolve against props, local state, and loop locals.
