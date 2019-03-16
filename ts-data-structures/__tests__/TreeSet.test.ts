import test from "ava";

import TreeSet from "../src/TreeSet";

test("it does stuff", t => {
  const set = new TreeSet<number>((a, b) => a - b)
    .add(2)
    .add(1)
    .add(3);
  t.true(set.has(3));
  t.deepEqual(set.size, 3);
  t.deepEqual([...set], [1, 2, 3]);
  t.true(set.delete(3));
  t.deepEqual(set.size, 2);
  t.false(set.has(3));
  t.deepEqual([...set], [1, 2]);
});
