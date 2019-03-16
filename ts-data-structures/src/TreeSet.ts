class TreeBranch<T> implements Iterable<T> {
  item: T;
  left?: TreeBranch<T>;
  right?: TreeBranch<T>;

  constructor(item: T) {
    this.item = item;
  }

  add(cmp: Comparator<T>, item: T): boolean {
    const n = cmp(item, this.item);
    if (n < 0) {
      if (this.left) {
        this.left.add(cmp, item);
      } else {
        this.left = new TreeBranch(item);
        return true;
      }
    } else if (n > 0) {
      if (this.right) {
        this.right.add(cmp, item);
      } else {
        this.right = new TreeBranch(item);
        return true;
      }
    }
    return false;
  }

  delete(cmp: Comparator<T>, item: T): boolean {
    if (this.left && cmp(item, this.left.item) === 0) {
      const node = this.left;
      this.left = node.left;
      if (node.right) {
        this.add(cmp, node.right.item);
      }
      return true;
    }
    if (this.right && cmp(item, this.right.item) === 0) {
      const node = this.right;
      this.right = node.right;
      if (node.left) {
        this.add(cmp, node.left.item);
      }
      return true;
    }
    if (this.left && this.left.delete(cmp, item)) {
      return true;
    }
    if (this.right && this.right.delete(cmp, item)) {
      return true;
    }
    return false;
  }

  has(cmp: Comparator<T>, item: T): boolean {
    const n = cmp(item, this.item);
    if (n === 0) {
      return true;
    }
    if (n < 0 && this.left && this.left.has(cmp, item)) {
      return true;
    }
    if (n > 0 && this.right && this.right.has(cmp, item)) {
      return true;
    }
    return false;
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

type Comparator<T> = (a: T, b: T) => number;

class TreeSet<T> implements Iterable<T> {
  private _root?: TreeBranch<T> = undefined;
  private _cmp: Comparator<T>;
  private _size: number = 0;

  constructor(cmp: Comparator<T>) {
    this._cmp = cmp;
  }

  get size() {
    return this._size;
  }

  add(item: T): this {
    if (this._root) {
      if (this._root.add(this._cmp, item)) {
        this._size++;
      }
    } else {
      this._root = new TreeBranch<T>(item);
      this._size++;
    }
    return this;
  }

  delete(item: T): boolean {
    if (!this._root) {
      return false;
    }
    if (this._cmp(item, this._root.item) === 0) {
      this.clear();
      return true;
    }
    if (this._root.delete(this._cmp, item)) {
      this._size--;
      return true;
    }
    return false;
  }

  has(item: T): boolean {
    if (!this._root) {
      return false;
    }
    return this._root.has(this._cmp, item);
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

export default TreeSet;
