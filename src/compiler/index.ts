// compiler/index.ts
import { tokenize } from './lexer.js';
import { astToRenderIR } from './astToIR.js';
import { generate } from '../codegen/generate.js';
import { ASTNode, Derived, Prop } from './types.js';
import { parseTemplate } from './parser.js';
import { buildTailwindFromAst } from './tailwind.js';


export type CompileOptions = {
  tag: string;                 // custom element tag, or module name
  runtimeImport: string;       // e.g. './runtime/dom'
  blockImport: string;         // e.g. './runtime/block'
  props: Prop[];
  derived: Derived[];
  esm?: boolean;               // output format
  dev?: boolean;               // add debug asserts
  sourcemap?: boolean;
};

function printAST(ast: ASTNode[]) {
  console.log(JSON.stringify(ast, null, 2));
}

export async function compile(source: string, opts: CompileOptions) {
  //console.log(source);
  const ast = parseTemplate(source);
  printAST(ast);
  
  const tailwindCss = await buildTailwindFromAst(ast);
  /*tailwindCss.then(css => {
    console.log(css);
  });*/

  const ir = astToRenderIR(ast);
  return generate(ir, opts, await tailwindCss);
}