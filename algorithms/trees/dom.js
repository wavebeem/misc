function Text(text) {
  return { type: "text", text };
}

function Element(name, attributes, children) {
  return { type: "element", name, attributes, children };
}

function inspect(node) {
  if (node.type === "text") {
    return node.text;
  }
  const { name, attributes, children } = node;
  const kids = children.map(inspect).join("");
  const attrs = _inspectAttrs(attributes);
  return `<${name}${attrs}>${kids}</${name}>`;
}

function _inspectAttrs(attrs) {
  let s = "";
  Object.keys(attrs).forEach(k => {
    const v = JSON.stringify(attrs[k]);
    s += ` ${k}=${v}`;
  });
  return s;
}

function mapElements(node, fn) {
  if (node.type === "text") {
    return node;
  }
  const kids = node.children.map(node => mapElements(node, fn));
  const elem = Element(node.name, node.attributes, kids);
  return fn(elem);
}

function mapText(node, fn) {
  if (node.type === "text") {
    return Text(fn(node.text));
  }
  const kids = node.children.map(node => mapText(node, fn));
  return Element(node.name, node.attributes, kids);
}

exports.Text = Text;
exports.Element = Element;
exports.mapElements = mapElements;
exports.mapText = mapText;
exports.inspect = inspect;
