// compiler/index.ts
import { generate } from '../codegen/generate.js';
import { ASTNode, Derived, Prop } from './util/types.js';
import { buildTailwindFromAst } from './util/tailwind.js';
import { parseTemplate } from './parser/index.js';
import { astToRenderIR } from './ir/index.js';


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
  //printAST(ast);
  
  const tailwindCss = await buildTailwindFromAst(ast);
  /*tailwindCss.then(css => {
    console.log(css);
  });*/

  const ir = astToRenderIR(ast);
  //console.log(JSON.stringify(ir))
  return generate(ir, opts, await tailwindCss);
}