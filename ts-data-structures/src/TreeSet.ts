class TreeBranch<T> implements Iterable<T> {
  item: T;
  left?: TreeBranch<T>;
  right?: TreeBranch<T>;

  constructor(item: T) {
    this.item = item;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    if (this.left) {
      yield* this.left;
    }
    yield this.item;
    if (this.right) {
      yield* this.right;
    }
  }
}

type TreeSetComparator<T> = (a: T, b: T) => number;

class TreeSet<T> implements Iterable<T> {
  private _root?: TreeBranch<T> = undefined;
  private _cmp: TreeSetComparator<T>;
  private _size: number = 0;

  constructor(cmp: TreeSetComparator<T>) {
    this._cmp = cmp;
  }

  get size() {
    return this._size;
  }

  add(item: T): this {
    if (this._root) {
      if (this._add(this._root, item)) {
        this._size++;
      }
    } else {
      this._root = new TreeBranch<T>(item);
      this._size++;
    }
    return this;
  }

  private _add(root: TreeBranch<T>, item: T): boolean {
    const n = this._cmp(item, root.item);
    if (n < 0) {
      if (root.left) {
        this._add(root.left, item);
      } else {
        root.left = new TreeBranch(item);
        return true;
      }
    } else if (n > 0) {
      if (root.right) {
        this._add(root.right, item);
      } else {
        root.right = new TreeBranch(item);
        return true;
      }
    }
    return false;
  }

  delete(item: T): boolean {
    if (!this._root) {
      return false;
    }
    if (this._cmp(item, this._root.item) === 0) {
      this.clear();
      return true;
    }
    if (this._delete(this._root, item)) {
      this._size--;
      return true;
    }
    return false;
  }

  private _delete(root: TreeBranch<T>, item: T): boolean {
    if (root.left && this._cmp(item, root.left.item) === 0) {
      const node = root.left;
      root.left = node.left;
      if (node.right) {
        this._add(root, node.right.item);
      }
      return true;
    }
    if (root.right && this._cmp(item, root.right.item) === 0) {
      const node = root.right;
      root.right = node.right;
      if (node.left) {
        this._add(root, node.left.item);
      }
      return true;
    }
    return (
      !!(root.left && this._delete(root.left, item)) ||
      !!(root.right && this._delete(root.right, item))
    );
  }

  has(item: T): boolean {
    if (!this._root) {
      return false;
    }
    return this._has(this._root, item);
  }

  private _has(root: TreeBranch<T>, item: T): boolean {
    const n = this._cmp(item, root.item);
    if (n === 0) {
      return true;
    }
    if (n < 0 && root.left && this._has(root.left, item)) {
      return true;
    }
    if (n > 0 && root.right && this._has(root.right, item)) {
      return true;
    }
    return false;
  }

  clear() {
    this._root = undefined;
    this._size = 0;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    if (this._root) {
      yield* this._root;
    }
  }
}

const set = new TreeSet<number>((a, b) => a - b)
  .add(2)
  .add(1)
  .add(3);

console.log(`has(3): ${set.has(3)}`);
console.log(`size: ${set.size}`);
console.log([...set]);
console.log("delete(3)");
set.delete(3);
console.log(`size: ${set.size}`);
console.log(`has(3): ${set.has(3)}`);
console.log([...set]);
