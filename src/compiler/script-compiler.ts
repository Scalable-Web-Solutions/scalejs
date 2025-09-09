// src/compiler/script-compiler.ts
import ts from "typescript";

export type ScriptCompileOptions = {
  exportedPropNames: string[];
  allowImports?: boolean; // default false: throw if <script> has imports
};

export type ScriptCompileResult = {
  methodsCode: string;     // class methods to inject
  topLevelCode: string;    // optional ctor-time code (empty for now)
  methodNames: string[];   // detected method names
  modulePreamble: string;  // import lines if allowImports=true, else ""
};

export function compileScriptToClass(scriptSrc: string, opt: ScriptCompileOptions): ScriptCompileResult {
  const source = ts.createSourceFile("comp.ts", scriptSrc, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const props = new Set(opt.exportedPropNames);

  const moduleImports: ts.Statement[] = [];
  const topLevelStmts: ts.Statement[] = [];
  const methodDecls: Array<{ name: string; node: ts.Node; params?: ts.NodeArray<ts.ParameterDeclaration>; body?: ts.Block }> = [];

  // --- 1) Collect top-level declarations ---
  for (const stmt of source.statements) {
    // strip `export` modifier if present
    const stripped = stripExport(stmt);

    // imports
    if (ts.isImportDeclaration(stripped) || ts.isImportEqualsDeclaration(stripped)) {
      if (!opt.allowImports) {
        throw new Error(`[scalejs] <script> contains import. Your output target is IIFE.\n` +
                        `Either remove imports or set allowImports:true and output an ES module instead.`);
      }
      moduleImports.push(stripped);
      continue;
    }

    // function foo() {}
    if (ts.isFunctionDeclaration(stripped) && stripped.name) {
      methodDecls.push({ name: stripped.name.text, node: stripped, params: stripped.parameters, body: stripped.body ?? ts.factory.createBlock([], true) });
      continue;
    }

    // const foo = () => {}, let bar = function(){}, var baz = function…
    if (ts.isVariableStatement(stripped)) {
      const isTopLevel = true;
      for (const d of stripped.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
          methodDecls.push({
            name: d.name.text,
            node: d.initializer,
            params: (d.initializer as any).parameters,
            body: (d.initializer as any).body && ts.isBlock((d.initializer as any).body)
              ? (d.initializer as any).body
              : ts.factory.createBlock([ ts.factory.createReturnStatement((d.initializer as any).body) ], true)
          });
          // skip emitting this var at top-level (we're hoisting to method)
          continue;
        }
      }
      // keep any var statements that weren’t function-valued (rare)
      topLevelStmts.push(stripped);
      continue;
    }

    // everything else (rare) – keep (we'll also rewrite prop-assignments inside)
    topLevelStmts.push(stripped);
  }

  // --- 2) Rewriter to turn prop assignments into this.prop, scope-aware ---
  function makeRewriter(scopeLocals: Set<string>): ts.TransformerFactory<ts.Node> {
    return (ctx): ts.Transformer<ts.Node> => {
      const F = ctx.factory;

      // rewrite left side Identifier -> this.Identifier (for props, not shadowed)
      const rewriteLeft = (left: ts.Expression): ts.Expression => {
        if (ts.isIdentifier(left)) {
          const name = left.text;
          if (props.has(name) && !scopeLocals.has(name)) {
            return F.createPropertyAccessExpression(F.createThis(), name);
          }
        }
        return left;
      };

      // expand destructuring: ({user} = expr) -> (__tmp = expr, this.user = __tmp.user, __tmp)
      const expandDestructuringAssign = (pattern: ts.BindingPattern, right: ts.Expression): ts.Expression | null => {
        const tmp = F.createUniqueName("__sws");
        const assigns: ts.Expression[] = [ F.createBinaryExpression(tmp, F.createToken(ts.SyntaxKind.EqualsToken), right) ];
        const pushObject = (name: string, sel: ts.Expression) => {
          if (props.has(name) && !scopeLocals.has(name)) {
            assigns.push(
              F.createBinaryExpression(
                F.createPropertyAccessExpression(F.createThis(), name),
                F.createToken(ts.SyntaxKind.EqualsToken),
                sel
              )
            );
          }
        };

        if (ts.isObjectBindingPattern(pattern)) {
          for (const el of pattern.elements) {
            if (!el.name) continue;
            if (ts.isIdentifier(el.name)) {
              // { user }
              const propName = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : el.name.text;
              pushObject(el.name.text, F.createPropertyAccessExpression(tmp, propName));
            } else if (ts.isBindingElement(el) && ts.isObjectBindingPattern(el.name)) {
              // nested object – skip in MVP expansion
            }
          }
        } else if (ts.isArrayBindingPattern(pattern)) {
          pattern.elements.forEach((el, idx) => {
            if (ts.isBindingElement(el) && ts.isIdentifier(el.name)) {
              const name = el.name.text;
              if (props.has(name) && !scopeLocals.has(name)) {
                pushes(assigns, F, name, F.createElementAccessExpression(tmp, F.createNumericLiteral(String(idx))));
              }
            }
          });
        } else {
          return null;
        }

        // return ( __tmp = right, …assigns…, __tmp )
        return assigns.length > 1
          ? F.createParenthesizedExpression(assigns.reduce((acc, exp) => F.createBinaryExpression(acc, F.createToken(ts.SyntaxKind.CommaToken), exp)))
          : null;
      };

      const visit: ts.Visitor = (node) => {
        // Assignment Expression
        if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
          if (ts.isIdentifier(node.left)) {
            const name = node.left.text;
            if (props.has(name) && !scopeLocals.has(name)) {
              const left = F.createPropertyAccessExpression(F.createThis(), name);
              if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                return F.updateBinaryExpression(node, left, node.operatorToken, ts.visitNode(node.right, visit) as ts.Expression);
              } else {
                // compound: x += y  -> this.x = this.x + (y)
                const op = compoundToBinary(node.operatorToken.kind);
                return F.createBinaryExpression(
                  left,
                  F.createToken(ts.SyntaxKind.EqualsToken),
                  F.createBinaryExpression(left, F.createToken(op), ts.visitNode(node.right, visit) as ts.Expression)
                );
              }
            }
          } else if (ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left)) {
            // Skip literal LHS
          } else if (ts.isArrayBindingPattern(node.left) || ts.isObjectBindingPattern(node.left)) {
            const expanded = expandDestructuringAssign(node.left, ts.visitNode(node.right, visit) as ts.Expression);
            if (expanded) return expanded;
          }
        }

        // ++x / x++ / --x / x--
        if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
          const op = ts.isPrefixUnaryExpression(node) ? node.operator : node.operator;
          const operand = ts.isPrefixUnaryExpression(node) ? node.operand : node.operand;
          if ((op === ts.SyntaxKind.PlusPlusToken || op === ts.SyntaxKind.MinusMinusToken) && ts.isIdentifier(operand)) {
            const name = operand.text;
            if (props.has(name) && !scopeLocals.has(name)) {
              const left = F.createPropertyAccessExpression(F.createThis(), name);
              const one = F.createNumericLiteral(1);
              const mathOp = op === ts.SyntaxKind.PlusPlusToken ? ts.SyntaxKind.PlusToken : ts.SyntaxKind.MinusToken;
              // desugar to (this.x = this.x ± 1)
              return F.createBinaryExpression(
                left,
                F.createToken(ts.SyntaxKind.EqualsToken),
                F.createBinaryExpression(left, F.createToken(mathOp), one)
              );
            }
          }
        }

        return ts.visitEachChild(node, visit, ctx);
      };

      return (node): ts.Node => {
        const result = ts.visitNode(node, visit);
        return result ?? node;
      };
    };
  }

  // Scope helpers
  function collectLocals(node: ts.Node): Set<string> {
    const s = new Set<string>();
    const visit = (n: ts.Node) => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) s.add(n.name.text);
      if (ts.isParameter(n) && ts.isIdentifier(n.name)) s.add(n.name.text);
      if (ts.isFunctionDeclaration(n) && n.name) s.add(n.name.text);
      ts.forEachChild(n, visit);
    };
    visit(node);
    return s;
  }

  // Transform each hoisted method body
  const methodCodes: string[] = [];
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  for (const m of methodDecls) {
    const locals = collectLocals(m.node);
    const tr = ts.transform(m.node, [makeRewriter(locals)]);
    const node = tr.transformed[0];

    // Emit as class method
    const method = ts.factory.createMethodDeclaration(
      undefined, undefined, m.name, undefined, undefined,
      (m.params ?? ts.factory.createNodeArray([])) as any,
      undefined,
      (node as any).body ?? ts.factory.createBlock([], true)
    );
    methodCodes.push(printer.printNode(ts.EmitHint.Unspecified, method, source));
    tr.dispose();
  }

  // Optionally transform top-level (rare). We keep it but don’t emit by default.
  let topLevelCode = "";
  if (topLevelStmts.length) {
    const locals = collectLocals(source);
    const tr = ts.transform(ts.factory.createNodeArray(topLevelStmts) as any, [makeRewriter(locals)]);
    const nodes = (tr.transformed[0] as any).statements as ts.Node[];
    topLevelCode = nodes.map(n => printer.printNode(ts.EmitHint.Unspecified, n, source)).join("\n");
    tr.dispose();
  }

  // Imports (if allowed)
  let modulePreamble = "";
  if (moduleImports.length) {
    modulePreamble = moduleImports.map(s => printer.printNode(ts.EmitHint.Unspecified, s, source)).join("\n");
  }

  return {
    methodsCode: methodCodes.join("\n\n"),
    topLevelCode,
    methodNames: methodDecls.map(d => d.name),
    modulePreamble
  };
}

/* -------------- small helpers -------------- */
function stripExport<T extends ts.Node>(node: T): T {
  if (!('modifiers' in node) || !node.modifiers) return node;
  const mods = (node.modifiers as ts.ModifierLike[]).filter(m => m.kind !== ts.SyntaxKind.ExportKeyword);
  // @ts-ignore
  return ts.factory.updateModifiers ? ts.factory.updateModifiers(node, mods) : ts.factory.updateNode(node, { modifiers: mods });
}
function isAssignmentOperator(k: ts.SyntaxKind){
  return k === ts.SyntaxKind.EqualsToken ||
         k === ts.SyntaxKind.PlusEqualsToken ||
         k === ts.SyntaxKind.MinusEqualsToken ||
         k === ts.SyntaxKind.AsteriskEqualsToken ||
         k === ts.SyntaxKind.SlashEqualsToken ||
         k === ts.SyntaxKind.PercentEqualsToken ||
         k === ts.SyntaxKind.AmpersandEqualsToken ||
         k === ts.SyntaxKind.BarEqualsToken ||
         k === ts.SyntaxKind.CaretEqualsToken ||
         k === ts.SyntaxKind.LessThanLessThanEqualsToken ||
         k === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
         k === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken;
}
function compoundToBinary(k: ts.SyntaxKind){
  switch (k) {
    case ts.SyntaxKind.PlusEqualsToken: return ts.SyntaxKind.PlusToken;
    case ts.SyntaxKind.MinusEqualsToken: return ts.SyntaxKind.MinusToken;
    case ts.SyntaxKind.AsteriskEqualsToken: return ts.SyntaxKind.AsteriskToken;
    case ts.SyntaxKind.SlashEqualsToken: return ts.SyntaxKind.SlashToken;
    case ts.SyntaxKind.PercentEqualsToken: return ts.SyntaxKind.PercentToken;
    case ts.SyntaxKind.AmpersandEqualsToken: return ts.SyntaxKind.AmpersandToken;
    case ts.SyntaxKind.BarEqualsToken: return ts.SyntaxKind.BarToken;
    case ts.SyntaxKind.CaretEqualsToken: return ts.SyntaxKind.CaretToken;
    case ts.SyntaxKind.LessThanLessThanEqualsToken: return ts.SyntaxKind.LessThanLessThanToken;
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken: return ts.ScriptTarget.ES2022, ts.SyntaxKind.GreaterThanGreaterThanToken;
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken: return ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
    default: return ts.SyntaxKind.PlusToken;
  }
}
function pushes(assigns: ts.Expression[], F: ts.NodeFactory, name: string, sel: ts.Expression){
  assigns.push(
    F.createBinaryExpression(
      F.createPropertyAccessExpression(F.createThis(), name),
      F.createToken(ts.SyntaxKind.EqualsToken),
      sel
    )
  );
}
