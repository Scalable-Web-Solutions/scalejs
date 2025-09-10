// src/compiler/script-compiler.ts
import * as ts from "typescript";

export type ScriptCompileOptions = {
  exportedPropNames: string[];
  allowImports?: boolean; // default false: throw if <script> has imports
};

export type ScriptCompileResult = {
  methodsCode: string;
  topLevelCode: string;
  methodNames: string[];
  modulePreamble: string;
};

function createMethodCompat(
  name: string | ts.Identifier,
  parameters: ts.NodeArray<ts.ParameterDeclaration>,
  body: ts.Block
): ts.MethodDeclaration {
  const F = ts.factory;
  const id = typeof name === 'string' ? F.createIdentifier(name) : name;
  // Older TS (8-arg signature)
  return (F.createMethodDeclaration as any)(
    /*modifiers*/ undefined,
    /*asteriskToken*/ undefined,
    id,
    /*questionToken*/ undefined,
    /*typeParameters*/ undefined,
    parameters,
    /*type*/ undefined,
    body
  );
}


export function compileScriptToClass(scriptSrc: string, opt: ScriptCompileOptions): ScriptCompileResult {
  const source = ts.createSourceFile("comp.ts", scriptSrc, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const props = new Set(opt.exportedPropNames);

  const moduleImports: ts.Statement[] = [];
  const topLevelStmts: ts.Statement[] = [];
  const methodDecls: Array<{ name: string; node: ts.Node; params?: ts.NodeArray<ts.ParameterDeclaration>; body?: ts.Block }> = [];

  const foundProps: Array<{ name: string; defaultVal?: string }> = [];
  const foundDerived: Array<{ name: string; expr: string; deps: string[] }> = [];

  function hasExportModifier(n: ts.Node) {
  // @ts-ignore
  const mods = n.modifiers as ts.NodeArray<ts.ModifierLike> | undefined;
  return !!mods?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }
  const p = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  // --- 1) Collect top-level declarations ---
  for (const stmt of source.statements) {
    // strip `export` modifier if present

    if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
    for (const d of stmt.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) {
        const name = d.name.text;
        const defaultVal = d.initializer
          ? p.printNode(ts.EmitHint.Unspecified, d.initializer, source)
          : undefined;
        foundProps.push({ name, defaultVal });
      }
    }
  }

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

function shouldRewriteIdentifier(id: ts.Identifier, parent?: ts.Node): boolean {
  if (!parent) return true;

  // don’t rewrite declaration names
  if (ts.isVariableDeclaration(parent) && parent.name === id) return false;
  if (ts.isParameter(parent) && parent.name === id) return false;
  if (ts.isFunctionDeclaration(parent) && parent.name === id) return false;

  // don’t rewrite property names / shorthand props
  if (ts.isPropertyAccessExpression(parent) && parent.name === id) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === id) return false;
  if (ts.isShorthandPropertyAssignment(parent) && parent.name === id) return false;

  // don’t rewrite labels, import/export names, etc. (add as you hit cases)

  return true;
}

const visit: ts.Visitor = (node) => {
  // 1) READ rewrite: bare Identifier → this.<prop>
  if (ts.isIdentifier(node)) {
    const name = node.text;
    if (props.has(name) && !scopeLocals.has(name) && shouldRewriteIdentifier(node, node.parent)) {
      return F.createPropertyAccessExpression(F.createThis(), name);
    }
  }

  // 2) Assignment expressions
  if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
    if (ts.isIdentifier(node.left)) {
      const name = node.left.text;
      if (props.has(name) && !scopeLocals.has(name)) {
        const left = F.createPropertyAccessExpression(F.createThis(), name);

        if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          // x = rhs  ->  this.x = (rewritten rhs)
          return F.updateBinaryExpression(
            node,
            left,
            node.operatorToken,
            ts.visitNode(node.right, visit) as ts.Expression
          );
        } else {
          // x += y -> this.x = this.x + (rewritten y)   (and similar for other compounds)
          const op = compoundToBinary(node.operatorToken.kind);
          return F.createBinaryExpression(
            left,
            F.createToken(ts.SyntaxKind.EqualsToken),
            F.createBinaryExpression(
              left,
              F.createToken(op),
              ts.visitNode(node.right, visit) as ts.Expression
            )
          );
        }
      }
    } else if (ts.isArrayBindingPattern(node.left) || ts.isObjectBindingPattern(node.left)) {
      const expanded = expandDestructuringAssign(
        node.left,
        ts.visitNode(node.right, visit) as ts.Expression
      );
      if (expanded) return expanded;
    }
  }

  // 3) ++x / x++ / --x / x--
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    const op = ts.isPrefixUnaryExpression(node) ? node.operator : node.operator;
    const operand = ts.isPrefixUnaryExpression(node) ? node.operand : node.operand;
    if ((op === ts.SyntaxKind.PlusPlusToken || op === ts.SyntaxKind.MinusMinusToken) && ts.isIdentifier(operand)) {
      const name = operand.text;
      if (props.has(name) && !scopeLocals.has(name)) {
        const left = F.createPropertyAccessExpression(F.createThis(), name);
        const one  = F.createNumericLiteral(1);
        const mathOp = op === ts.SyntaxKind.PlusPlusToken ? ts.SyntaxKind.PlusToken : ts.SyntaxKind.MinusToken;
        // desugar to: this.x = this.x ± 1
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
    const method = createMethodCompat(
    m.name,
      (m.params ?? ts.factory.createNodeArray([])) as ts.NodeArray<ts.ParameterDeclaration>,
      (node as any).body ?? ts.factory.createBlock([], true)
    );
    methodCodes.push(printer.printNode(ts.EmitHint.Unspecified, method, source));

    tr.dispose();
  }

  // Optionally transform top-level (rare). We keep it but don’t emit by default.
  let topLevelCode = "";
  if (topLevelStmts.length) {
  const locals = collectLocals(source);

  // ✅ wrap in a Block so transform returns a node with `.statements`
  const block = ts.factory.createBlock(
    topLevelStmts as ts.Statement[],
    /*multiLine*/ true
  );

  const tr = ts.transform(block, [makeRewriter(locals)]);
  const newBlock = tr.transformed[0] as ts.Block;

  // Defensive: handle unexpected shapes
  const stmts = ts.isBlock(newBlock) ? newBlock.statements : ts.factory.createNodeArray([]);

  topLevelCode = Array.from(stmts).map(
    n => printer.printNode(ts.EmitHint.Unspecified, n, source)
  ).join("\n");

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
// Replace your existing stripExport with this version:
function stripExport<T extends ts.Node>(node: T): T {
  // If there are no modifiers, nothing to strip.
  // Some TS versions store modifiers as NodeArray, others undefined.
  // @ts-ignore
  const mods = (node.modifiers as ts.NodeArray<ts.ModifierLike> | undefined)?.filter(
    m => m.kind !== ts.SyntaxKind.ExportKeyword && m.kind !== ts.SyntaxKind.DefaultKeyword
  );

  if (!mods) return node;

  const F = ts.factory;

  if (ts.isFunctionDeclaration(node)) {
    return F.updateFunctionDeclaration(
      node,
      mods,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      node.body
    ) as unknown as T;
  }

  if (ts.isVariableStatement(node)) {
    return F.updateVariableStatement(
      node,
      mods,
      node.declarationList
    ) as unknown as T;
  }

  if (ts.isClassDeclaration(node)) {
    return F.updateClassDeclaration(
      node,
      mods,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      node.members
    ) as unknown as T;
  }

  if (ts.isInterfaceDeclaration(node)) {
    return F.updateInterfaceDeclaration(
      node,
      mods,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      node.members
    ) as unknown as T;
  }

  if (ts.isEnumDeclaration(node)) {
    return F.updateEnumDeclaration(
      node,
      mods,
      node.name,
      node.members
    ) as unknown as T;
  }

  if (ts.isTypeAliasDeclaration(node)) {
    return F.updateTypeAliasDeclaration(
      node,
      mods,
      node.name,
      node.typeParameters,
      node.type
    ) as unknown as T;
  }

  // Fallback: leave node as-is if it's some other stmt kind.
  return node;
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
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken: return ts.SyntaxKind.GreaterThanGreaterThanToken; // <- fixed
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