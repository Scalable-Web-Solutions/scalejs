export type ASTNode =
  | TextNode
  | ElementNode
  | MustacheNode
  | IfBlockNode
  | EachBlockNode;

export interface TextNode {
  kind: 'Text';
  value: string;   // raw text
}

export interface ElementNode {
  kind: 'Element';
  tag: string;
  attrs: Attr[];
  children: ASTNode[];
}

export interface Attr {
  name: string;          // class, id, data-*, @click, on:click, etc.
  value: string | true;  // true for boolean attributes
}

export interface MustacheNode {
  kind: 'Mustache';
  expr: string;          // raw JS expression (you already have _evalExpr)
}

export interface IfBlockNode {
  kind: 'IfBlock';
  branches: Array<{ expr: string; children: ASTNode[] }>; // includes first "if" and any ":else if"
  elseChildren?: ASTNode[];                                // for ":else"
}

export interface EachBlockNode {
  kind: 'EachBlock';
  listExpr: string;      // e.g. "goat"
  itemName: string;      // e.g. "g"
  indexName?: string;    // optional index
  children: ASTNode[];
}

export type TokKind =
  | 'TEXT' | 'LBRACE' | 'RBRACE'
  | 'HASH_IF' | 'ELSE_IF' | 'ELSE' | 'END_IF'
  | 'HASH_EACH' | 'END_EACH'
  | 'IDENT' | 'STRING' | 'NUMBER' | 'OTHER'
  | 'LT' | 'GT' | 'SLASH' | 'EQUALS'
  | 'AT' | 'ONCOLON' | 'COLON' | 'DOT' | 'DASH' | 'CHAR' | 'TEMPLATE_START' | 'TEMPLATE_TEXT' | 'TEMPLATE_INTERP_START' | 'TEMPLATE_INTERP_END' | 'TEMPLATE_END';

export interface Token {
  kind: TokKind;
  value?: string;
  pos: number; line: number; col: number;
}

export interface Prop {
  name: string;
  defaultVal?: string; // stringified initializer or undefined
}

export interface Derived {
  name: string;        // e.g. "label"
  expr: string;        // e.g. "`${doubled} clicks`"
  deps: string[];      // e.g. ["doubled"]
}

export interface IfMeta {
  id: string;
  params: string[];
  branches: Array<{ id: string; key: string; expr: string; html: string }>;
  elseBranch?: { id: string; key: 'else'; html: string };
}
export interface EachMeta {
  id: string;
  params: string[]; // [listExpr, itemName, idxName?]
  items: string;    // inner HTML containing <sws-bind …>
}

export type TemplateIR = {
  html: string;          // fully rendered HTML with <sws-bind> placeholders
  ifBlocks: IfMeta[];    // from astToHtmlAndMeta
  eachBlocks: EachMeta[];// from astToHtmlAndMeta
};

export type MountPoint = { parent: Node; anchor?: Node };

export type IRText =
  | { k: 'staticText'; value: string }
  | { k: 'text'; expr: string; stateDeps: string[]; localDeps: string[] };

export type IRAttrStatic = { kind: 'static'; name: string; value: string | true };
export type IRAttrDynamic = { kind: 'dynamic'; name: string; expr: string; stateDeps: string[]; localDeps: string[] };
export type IRAttr = IRAttrStatic | IRAttrDynamic;

export type IRElem = {
  k: 'elem';
  tag: string;
  attrs: IRAttr[];
  on: { evt: string; handler: string }[];
  children: IRNode[];
};

export type IRIf = {
  k: 'if';
  branches: Array<{ expr: string; stateDeps: string[]; localDeps: string[]; node: IRNode }>;
  elseNode?: IRNode;
};

export type IREach = {
  k: 'each';
  listExpr: string;
  listStateDeps: string[];
  listLocalDeps: string[]; // usually []
  item: string;
  index?: string;
  keyExpr?: string;
  keyStateDeps?: string[];
  keyLocalDeps?: string[];
  node: IRNode;
};

export type IRFragment = { k: 'fragment'; children: IRNode[] };

export type IRNode = IRText | IRElem | IRIf | IREach | IRFragment;

export type RenderModule = {
  nodes: IRNode[];
  script?: string;     // raw script content
};