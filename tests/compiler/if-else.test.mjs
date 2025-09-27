import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize } from '../../dist/compiler/lexer.js';
import { parseTemplate } from '../../dist/compiler/parser.js';

const TEMPLATE = `\n{#if foo}\n  {:else if bar}\n  {:else}\n  {/if}\n`;

test('lexer retains else-if condition tokens', () => {
  const tokens = tokenize(TEMPLATE);
  const elseIfIndex = tokens.findIndex(t => t.kind === 'ELSE_IF');
  assert.notStrictEqual(elseIfIndex, -1, 'expected ELSE_IF token');

  const condTokens = [];
  for (let i = elseIfIndex + 1; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.kind === 'RBRACE') break;
    if (typeof tk.value === 'string' && tk.value.trim()) {
      condTokens.push(tk.value.trim());
    }
  }

  assert.deepStrictEqual(condTokens, ['bar'], 'else-if condition should remain as expression tokens');

  const elseIndex = tokens.findIndex(t => t.kind === 'ELSE');
  assert.notStrictEqual(elseIndex, -1, 'expected ELSE token');
  const nextAfterElse = tokens[elseIndex + 1];
  assert.ok(nextAfterElse?.kind === 'RBRACE' || nextAfterElse?.kind === 'TEXT' && !nextAfterElse.value?.trim(),
    'else block should close immediately without expression tokens');
});

test('parser builds branches for else-if and else', () => {
  const ast = parseTemplate(TEMPLATE);
  const node = ast.find(n => n.kind === 'IfBlock');
  assert.ok(node, 'template should include an if block node');
  assert.equal(node.kind, 'IfBlock');

  assert.equal(node.branches.length, 2, 'if block should have if + else-if branches');
  assert.equal(node.branches[0].expr, 'foo');
  assert.equal(node.branches[1].expr, 'bar');
  assert.ok(Array.isArray(node.branches[0].children));
  assert.ok(Array.isArray(node.branches[1].children));
  assert.ok(
    node.branches[0].children.every(child => child.kind === 'Text' && !child.value.trim()),
    'if branch should only contain whitespace text nodes'
  );
  assert.ok(
    node.branches[1].children.every(child => child.kind === 'Text' && !child.value.trim()),
    'else-if branch should only contain whitespace text nodes'
  );

  assert.ok(Array.isArray(node.elseChildren), 'else block should exist');
  assert.ok(
    node.elseChildren.every(child => child.kind === 'Text' && !child.value.trim()),
    'else block should only contain whitespace text nodes'
  );
});
