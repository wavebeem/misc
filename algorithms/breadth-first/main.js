const util = require("util");

class BST {
  constructor(root = undefined) {
    this.root = root;
  }

  *dfs() {
    yield* BST._dfs(this.root);
  }

  static *_dfs(node) {
    if (!node) {
      return;
    }
    const { value, left, right } = node;
    yield* this._dfs(left);
    yield* this._dfs(right);
    yield value;
  }

  *bfs() {
    yield* BST._bfs(this.root);
  }

  static *_bfs(node) {
    if (!node) {
      return;
    }
    const todo = new Queue([node]);
    for (const { value, left, right } of todo) {
      yield value;
      if (left) {
        todo.add(left);
      }
      if (right) {
        todo.add(right);
      }
    }
  }
}

BST.Node = class Node {
  constructor(value, left, right) {
    this.value = value;
    this.left = left;
    this.right = right;
  }
};

class _BaseList {
  constructor(data = []) {
    this.data = data;
  }

  add(item) {
    this.data.push(item);
    return this;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  *[Symbol.iterator]() {
    while (!this.isEmpty()) {
      yield this.remove();
    }
  }
}

class Queue extends _BaseList {
  remove() {
    return this.data.shift();
  }
}

class Stack extends _BaseList {
  remove() {
    return this.data.pop();
  }
}

function node(value, left = undefined, right = undefined) {
  return new BST.Node(value, left, right);
}

function show(x) {
  console.log(util.inspect(x, { depth: null, colors: "auto" }));
  return x;
}

const tree = new BST(
  node(1, node(2, node(6, node(7, node(8)))), node(3, node(4, node(5))))
);

console.log("\n--- tree ---");
show(tree);

console.log("\n--- dfs ---");
show([...tree.dfs()]);

console.log("\n--- bfs ---");
show([...tree.bfs()]);
