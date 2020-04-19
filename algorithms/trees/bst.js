// A normal binary search tree would just use `<` to compare data points, but
// often we want to stick complicated data structures in here and have them
// sorted by a single key, so this lets us choose the key and replace the "lt"
// (less than) operation. So essentially we parameterize the entire module.
function of(opts) {
  opts = opts || {};
  const key = opts.key || (x => x);
  const lt = opts.lt || ((a, b) => a < b);

  const tip = { type: "tip" };

  function branch(data, left, right) {
    return { type: "branch", data, left, right };
  }

  function leaf(data) {
    return branch(data, tip, tip);
  }

  function add(node, newData) {
    if (node.type === "tip") {
      return leaf(newData);
    } else if (node.type === "branch") {
      const { data, left, right } = node;
      // Essentially `newData < data`
      if (lt(key(newData), key(data))) {
        return branch(data, add(left, newData), right);
      } else {
        return branch(data, left, add(right, newData));
      }
    }
    throw new Error("not a valid node");
  }

  function inspect(node) {
    const s = _inspect(node);
    return `#<BST ${s}>`;
  }

  function _inspect(node) {
    if (node.type === "tip") {
      return "()";
    } else if (node.type === "branch") {
      const { data, left, right } = node;
      const d = JSON.stringify(data);
      const l = _inspect(left);
      const r = _inspect(right);
      if (l === "()" && r === "()") {
        return `${d}`;
      }
      return `(${d} ${l} ${r})`;
    }
    throw new Error("not a valid node");
  }

  function fromList(list) {
    return list.reduce(add, tip);
  }

  return { tip, branch, add, inspect, fromList };
}

exports.of = of;
exports.default = of();
