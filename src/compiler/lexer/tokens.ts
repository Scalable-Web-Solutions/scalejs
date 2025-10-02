export type TokKind =
  | "STRING" | "TEXT"
  | "LBRACE" | "RBRACE" | "LT" | "GT" | "EQUALS" | "SLASH" | "AT"
  | "IDENT" | "NUMBER" | "CHAR"
  | "HASH_IF" | "HASH_EACH" | "ELSE_IF" | "ELSE" | "END_IF" | "END_EACH";

export interface Token {
  kind: TokKind;
  value?: string;
  pos: number;
  line: number;
  col: number;
}