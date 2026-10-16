import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTree,
  runSearch,
  LECTURE_VALUES,
  optimalPath,
  labelFor,
} from "../src/algorithm.js";

function oracle(tree, id = 0) {
  const node = tree.nodes[id];
  if (node.leaf) return node.value;
  const scores = node.children.map((child) => oracle(tree, child));
  return node.isMax ? Math.max(...scores) : Math.min(...scores);
}

test("lecture example: minimax visits all leaves and chooses B with value 3", () => {
  const tree = buildTree();
  const final = runSearch(tree, false).at(-1);
  assert.equal(final.result, 3);
  assert.equal(final.visitedLeaves, 8);
  assert.equal(final.visitedNodes, 15);
  assert.equal(final.pruned.length, 0);
  assert.deepEqual(
    optimalPath(final).map((id) => tree.nodes[id].label),
    ["A", "B", "D", "I"],
  );
});

test("alpha–beta cuts off K and the G subtree in the lecture example", () => {
  const tree = buildTree();
  const frames = runSearch(tree, true);
  const final = frames.at(-1);
  assert.equal(final.result, 3);
  assert.equal(final.visitedLeaves, 5);
  assert.deepEqual(
    final.pruned.map((id) => tree.nodes[id].label),
    ["K", "G", "N", "O"],
  );
  assert.equal(final.visitedNodes + final.pruned.length, tree.nodes.length);
  const cutoffs = frames.filter((f) => f.type === "prune");
  assert.equal(cutoffs.length, 2);
  for (const f of cutoffs)
    assert.ok(f.bounds[f.active].beta <= f.bounds[f.active].alpha);
  assert.equal(
    final.valueTypes[tree.nodes.find((n) => n.label === "E").id],
    "lower",
  );
  assert.equal(
    final.valueTypes[tree.nodes.find((n) => n.label === "C").id],
    "upper",
  );
});

test("snapshots are independent and rewindable", () => {
  const tree = buildTree();
  const frames = runSearch(tree);
  assert.equal(frames[0].visitedNodes, 0);
  assert.deepEqual(frames[0].values, {});
  assert.deepEqual(frames[0].pruned, []);
  assert.deepEqual(frames[0].stack, []);
  assert.ok(frames.at(-1).visitedNodes > 0);
  assert.equal(frames.find((f) => f.type === "evaluate").visitedLeaves, 1);
});

test("both searches match an independent oracle across depths, branching, root players, orders, negatives and ties", () => {
  let seed = 127;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed % 31) - 15;
  };
  let checked = 0;
  for (const depth of [2, 3, 4])
    for (const branching of [2, 3])
      for (const rootMax of [true, false]) {
        for (let sample = 0; sample < 6; sample++) {
          const leaves = Array.from({ length: branching ** depth }, () =>
            sample === 0 ? 0 : random(),
          );
          const tree = buildTree(depth, branching, leaves, rootMax);
          for (const direction of ["left", "right"]) {
            const mini = runSearch(tree, false, direction).at(-1);
            const ab = runSearch(tree, true, direction).at(-1);
            assert.equal(mini.result, oracle(tree));
            assert.equal(ab.result, oracle(tree));
            assert.ok(ab.visitedNodes <= mini.visitedNodes);
            assert.equal(ab.visitedNodes + ab.pruned.length, tree.nodes.length);
            assert.equal(mini.visitedLeaves, leaves.length);
            const selected = ab.bestChildren[0];
            assert.equal(oracle(tree, selected), oracle(tree));
            for (const id of ab.pruned) assert.equal(ab.values[id], undefined);
            checked++;
          }
        }
      }
  assert.equal(checked, 144);
});

test("reversing traversal preserves the result while changing pruning", () => {
  const tree = buildTree(3, 2, LECTURE_VALUES);
  const left = runSearch(tree, true, "left").at(-1);
  const right = runSearch(tree, true, "right").at(-1);
  assert.equal(left.result, right.result);
  assert.notDeepEqual(left.pruned, right.pruned);
});

test("invalid leaf values and unsupported sizes are rejected", () => {
  assert.throws(() => buildTree(3, 2, [1, 2]));
  assert.throws(() => buildTree(1, 2, [1, 2]));
  assert.throws(() => buildTree(3, 2, [...LECTURE_VALUES.slice(1), Infinity]));
  assert.equal(labelFor(26), "AA");
  assert.equal(labelFor(51), "AZ");
  assert.equal(labelFor(52), "BA");
});
