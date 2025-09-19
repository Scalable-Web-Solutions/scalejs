// runtime/dom.ts

export function element<K extends keyof HTMLElementTagNameMap>(name: K) {
  return document.createElement(name);
}

export function text(data = "") { 
  return document.createTextNode(data);
}

export function comment(data = "") {
  return document.createComment(data);
}

export function insert(parent: Node, node: Node, anchor?: Node | null) {
  parent.insertBefore(node, anchor ?? null);
}

export function detach(node: Node) {
  const p = node.parentNode;
  if (p) p.removeChild(node);
}

export function set_data(t: Text, v: unknown) {
  const s = v == null ? "" : String(v);
  if (t.nodeValue !== s) t.nodeValue = s;
}

const XLINK_NS = 'http://www.w3.org/1999/xlink';
function attr(node: Element ,name: string,value: boolean){
  if(value==null||value===false){ node.removeAttribute(name); return; }
  if (name === 'xlink:href') {
    node.setAttributeNS(XLINK_NS, 'href', value===true?'':String(value));
    return;
  }
  node.setAttribute(name, value===true?'':String(value));
}

export function listen<T extends Element>(
  el: T,
  type: string,
  fn: (ev: Event) => void
) {
  el.addEventListener(type, fn);
  return () => el.removeEventListener(type, fn);
}