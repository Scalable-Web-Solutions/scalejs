import test from "node:test";
import assert from "node:assert/strict";

import { parseTemplate } from "../../dist/compiler/parser/index.js";
import { astToRenderIR } from "../../dist/compiler/ir/index.js";

const COMPLEX_TEMPLATE = `
<script>
  export const foo = 1;
  const helper = value => value * 2;
</script>
<div class="wrapper flex" data-title={\`Title: \${state.title}\`} @click={handleClick} @focus={handleFocus({ id: state.id })} className={state.mode ? 'mode-dark' : 'mode-light'}>
  {#if state.ready}
    <span class={\`status-\${state.status}\`} data-label={itemLabel}>{message}</span>
  {:else if state.pending}
    Loading {state.pendingMessage ?? "..."}
  {:else}
    <button class="btn danger" disabled={isDisabled}>Retry</button>
  {/if}
  {#each items as item, index}
    <Widget slot={\`slot-\${index}\`} label={item.label} @select={selectItem(item)} data-flag={item.flag ? 'yes' : 'no'}>
      {#if item.visible}
        <span class={item.kind ? 'pill active' : 'pill'}>{item.text}</span>
      {:else}
        <span class="fallback">Hidden</span>
      {/if}
    </Widget>
  {/each}
</div>
`;

test("ir builder assembles render IR for complex templates", () => {
  const ast = parseTemplate(COMPLEX_TEMPLATE);
  const ir = astToRenderIR(ast);

  assert.equal(ir.nodes.length, 1, "expected script block to be stripped and leave single root node");
  assert.ok(ir.script && ir.script.includes("export const foo = 1;"), "inline <script> contents should be collected");

  const root = ir.nodes[0];
  assert.equal(root.k, "elem", "root node should be an element");
  assert.equal(root.tag, "div", "root element should be a div");

  const staticClass = root.attrs.find(a => a.name === "class");
  assert.ok(staticClass && staticClass.kind === "static", "class attribute should stay static");
  assert.equal(staticClass.value, "wrapper flex", "static class value should be preserved");

  const titleAttr = root.attrs.find(a => a.name === "data-title");
  assert.ok(titleAttr && titleAttr.kind === "dynamic", "data-title should become dynamic attr");
  assert.equal(titleAttr.expr, "`Title: ${state.title}`", "template literal expression should round-trip");
  assert.ok(titleAttr.stateDeps.includes("state"), "state deps should include state object");

  const classNameAttr = root.attrs.find(a => a.name === "className");
  assert.ok(classNameAttr && classNameAttr.kind === "dynamic", "className should capture conditional expression");
  assert.ok(classNameAttr.expr.includes("mode-dark"), "dynamic className should keep ternary literal");
  assert.ok(classNameAttr.stateDeps.includes("mode"), "className deps should include property name");

  const clickHandler = root.on.find(evt => evt.evt === "click");
  assert.ok(clickHandler, "@click handler should be recorded");
  assert.equal(clickHandler.handler, "handleClick(ev)", "bare handler should be wrapped to receive the event");

  const focusHandler = root.on.find(evt => evt.evt === "focus");
  assert.ok(focusHandler, "@focus handler should be recorded");
  assert.equal(focusHandler.handler, "handleFocus({ id: state.id })", "complex handler should retain full expression");

  const ifBlock = root.children.find(child => child.k === "if");
  assert.ok(ifBlock, "root children should contain if block");
  assert.deepEqual(
    ifBlock.branches.map(b => b.expr),
    ["state.ready", "state.pending"],
    "if branches should preserve expressions"
  );
  assert.ok(ifBlock.elseNode && ifBlock.elseNode.k === "elem" && ifBlock.elseNode.tag === "button", "else branch should wrap fallback button");

  const eachBlock = root.children.find(child => child.k === "each");
  assert.ok(eachBlock, "root children should contain each block");
  assert.equal(eachBlock.listExpr, "items", "each block should keep list expression");
  assert.equal(eachBlock.item, "item", "each block should expose item binding");
  assert.equal(eachBlock.index, "index", "each block should expose index binding");

  const widget = eachBlock.node;
  assert.equal(widget.k, "elem", "each block payload should be an element node");
  assert.equal(widget.tag, "Widget", "inner element should remain Widget tag");

  const slotAttr = widget.attrs.find(a => a.name === "slot");
  assert.ok(slotAttr && slotAttr.kind === "dynamic", "slot attr should be dynamic");
  assert.equal(slotAttr.expr, "`slot-${index}`", "slot attr should keep template literal");
  assert.ok(slotAttr.localDeps.includes("index"), "slot attr should depend on each index");

  const selectEvt = widget.on.find(evt => evt.evt === "select");
  assert.ok(selectEvt, "@select handler should be captured");
  assert.equal(selectEvt.handler, "selectItem(item)", "event handler should preserve call expression");
  assert.ok(selectEvt.localDeps.includes("item"), "handler deps should mark local item binding");

  const innerIf = widget.children.find(child => child.k === "if");
  assert.ok(innerIf, "widget should contain nested if block");
  assert.equal(innerIf.branches[0].expr, "item.visible", "nested if condition should stay intact");

  const hints = new Set(ir.tailwindHints);
  ["wrapper", "flex", "btn", "danger", "pill", "active", "fallback"].forEach(cls =>
    assert.ok(hints.has(cls), `tailwind hints should include ${cls}`)
  );
});
