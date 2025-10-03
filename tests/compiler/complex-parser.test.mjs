import test from "node:test";
import assert from "node:assert/strict";

import { parseTemplate } from "../../dist/compiler/parser.js";

const COMPLEX_TEMPLATE = `<div class="wrapper" data-title={\`Title: \${state.title}\`} @click={handleClick(state)}>
  {#if state.ready}
    <span class={\`status-\${state.status}\`}>{message}</span>
  {:else if state.pending}
    Loading {state.pendingMessage ?? "..."}
  {:else}
    <button disabled={isDisabled} data-mode="fallback">Retry</button>
  {/if}
  {#each items as item, index}
    <Widget slot={\`slot-\${index}\`} label={item.label} @select={selectItem(item, { index })} />
  {/each}
</div>`;

const stripWhitespace = nodes => nodes.filter(node => node.kind !== "Text" || node.value.trim().length > 0);
const findNode = (nodes, predicate) => stripWhitespace(nodes).find(predicate);

test("parser builds AST for nested blocks and directives", () => {
  const ast = parseTemplate(COMPLEX_TEMPLATE);
  assert.equal(ast.length, 1, "expected a single root node");

  const root = ast[0];
  assert.equal(root.kind, "Element", "root should be an element");
  assert.equal(root.tag, "div", "root element should be a <div>");

  const classAttr = root.attrs.find(attr => attr.name === "class");
  assert.ok(classAttr, "div should capture static class attribute");
  assert.equal(classAttr.value, "wrapper", "class value should be unwrapped from quotes");

  const clickAttr = root.attrs.find(attr => attr.name === "@click");
  assert.ok(clickAttr, "div should include event directive attr");
  assert.equal(clickAttr.value, "{handleClick(state)}", "@click expression should round-trip");

  const ifBlock = findNode(root.children, node => node.kind === "IfBlock");
  assert.ok(ifBlock, "expected nested if block under div");
  assert.deepEqual(
    ifBlock.branches.map(branch => branch.expr),
    ["state.ready", "state.pending"],
    "if/else-if conditions should preserve expressions"
  );

  const pendingChildren = stripWhitespace(ifBlock.branches[1].children);
  const pendingText = pendingChildren.find(node => node.kind === "Text");
  assert.ok(pendingText && pendingText.value.includes("Loading"), "else-if branch should keep leading text");
  const pendingMustache = pendingChildren.find(node => node.kind === "Mustache");
  assert.ok(
    pendingMustache && pendingMustache.expr === "state.pendingMessage ?? \"...\"",
    "else-if branch should expose mustache expression"
  );

  assert.ok(ifBlock.elseChildren, "else branch should be recorded");
  const elseButton = findNode(ifBlock.elseChildren ?? [], node => node.kind === "Element" && node.tag === "button");
  assert.ok(elseButton, "else branch should contain button element");
  const disabledAttr = elseButton.attrs.find(attr => attr.name === "disabled");
  assert.ok(disabledAttr, "button should include disabled binding");
  assert.equal(disabledAttr.value, "{isDisabled}", "disabled attr should wrap expression in braces");

  const eachBlock = findNode(root.children, node => node.kind === "EachBlock");
  assert.ok(eachBlock, "expected each block after if block");
  assert.equal(eachBlock.listExpr, "items", "each block should capture list expression");
  assert.equal(eachBlock.itemName, "item", "each block should capture item name");
  assert.equal(eachBlock.indexName, "index", "each block should capture index alias");

  const widget = findNode(eachBlock.children, node => node.kind === "Element" && node.tag === "Widget");
  assert.ok(widget, "each block should contain Widget element");
  const slotAttr = widget.attrs.find(attr => attr.name === "slot");
  assert.ok(slotAttr, "Widget should have slot attribute");
  assert.equal(slotAttr.value, "{`slot-${index}`}", "template literal attr should be preserved inside braces");
  const labelAttr = widget.attrs.find(attr => attr.name === "label");
  assert.ok(labelAttr, "Widget should include label binding");
  assert.equal(labelAttr.value, "{item.label}", "label attr should carry expression braces");
  const selectAttr = widget.attrs.find(attr => attr.name === "@select");
  assert.ok(selectAttr, "Widget should capture event directive");
  assert.equal(
    selectAttr.value,
    "{selectItem(item, { index })}",
    "event directive should retain complex expression"
  );
});
