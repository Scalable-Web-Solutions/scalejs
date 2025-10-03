import test from "node:test";
import assert from "node:assert/strict";

import { tokenize } from "../../dist/compiler/lexer.js";

const COMPLEX_TEMPLATE = `
<div class="wrapper {state.mode === 'dark' ? 'bg-dark' : \`bg-light-\${state.theme}\`}" @click={handleClick({ value: items?.[0]?.id ?? 'none' })} data-count={items.length} data-title={\`Title: \${state.title}\`}>
  {#each items as item, index (item.id)}
    <Widget slot={\`slot-\${index}\`} label={item.label ?? \`Label \${index}\`} disabled={item.flags?.includes('disabled')}>
      {#if item.visible}
        <span data-test={\`span-\${item.id}\`} @mouseover.prevent={() => hover(index, { meta: item.meta, tags: [...item.tags] })}>
          {item.label}
        </span>
      {:else}
        <button type="button" class={\`btn \${item.kind ?? 'default'}\`}>{item.cta ?? 'select'}</button>
      {/if}
    </Widget>
  {:else}
    <p class="empty">{fallback()}</p>
  {/each}
</div>
`;

test("lexer tokenizes complex .scale constructs", () => {
  const tokens = tokenize(COMPLEX_TEMPLATE);

  const blockKinds = tokens
    .filter(t => ["HASH_EACH", "HASH_IF", "ELSE", "END_IF", "END_EACH"].includes(t.kind))
    .map(t => t.kind);
  assert.deepStrictEqual(
    blockKinds,
    ["HASH_EACH", "HASH_IF", "ELSE", "END_IF", "ELSE", "END_EACH"],
    "expected nested each/if branches to emit matching block tokens"
  );

  const wrapperClass = tokens.find(t => t.kind === "STRING" && t.value.startsWith("\"wrapper"));
  assert.ok(
    wrapperClass && wrapperClass.value.includes("`bg-light-${state.theme}`"),
    "class attribute should preserve template literal content"
  );

  const slotExpression = tokens.find(t => t.kind === "TEXT" && t.value === "`slot-${index}`");
  assert.ok(slotExpression, "slot directive should capture template literal expression");

  const hoverHandler = tokens.find(
    t =>
      t.kind === "TEXT" &&
      t.value.includes("hover(index, { meta: item.meta, tags: [...item.tags] })")
  );
  assert.ok(hoverHandler, "event handler expression should retain nested object literal");

  const eventIdent = tokens.find(t => t.kind === "IDENT" && t.value === "mouseover.prevent");
  assert.ok(eventIdent, "expected lexer to keep dotted event directive name");

  const dataTitleExpr = tokens.find(t => t.kind === "TEXT" && t.value === "`Title: ${state.title}`");
  assert.ok(dataTitleExpr, "data-title binding should emit raw template literal expression");
});
