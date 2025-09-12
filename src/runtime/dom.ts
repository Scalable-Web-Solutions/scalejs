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

export function attr(el: Element, name: string, value: unknown) {
  if (value == null || value === false) {
    el.removeAttribute(name);
  } else if (value === true) {
    el.setAttribute(name, "");
  } else {
    el.setAttribute(name, String(value));
  }
}

export function listen<T extends Element>(
  el: T,
  type: string,
  fn: (ev: Event) => void
) {
  el.addEventListener(type, fn);
  return () => el.removeEventListener(type, fn);
}
