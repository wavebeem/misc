const BST = require("./bst");
const DOM = require("./dom");

const Tree = BST.of({
  key: x => x,
  lt: (a, b) => a < b
});
const t = Tree.fromList([5, 1, 7, 3]);
console.log(Tree.inspect(t));
// console.log(t);

const dom0 = DOM.Element("ul", {}, [
  DOM.Element("li", {}, [DOM.Text("First")]),
  DOM.Element("li", { class: "odd" }, [DOM.Text("Second")]),
  DOM.Element("li", {}, [DOM.Text("Third")])
]);
console.log(DOM.inspect(dom0));
const dom1 = DOM.mapElements(dom0, elem =>
  DOM.Element(
    elem.name.toUpperCase(),
    elem.attributes,
    elem.children.slice().reverse()
  )
);
console.log(DOM.inspect(dom1));
const dom2 = DOM.mapText(dom1, text => text.toUpperCase());
console.log(DOM.inspect(dom2));
