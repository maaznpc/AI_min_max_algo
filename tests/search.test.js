import test from "node:test";
import assert from "node:assert/strict";
import {
  makeGraph,
  runGraphSearch,
  automaticHeuristic,
  checkHeuristic,
  SEARCH_ALGORITHMS,
} from "../src/search.js";
const simple = (ids, edges) => ({
  nodes: ids.map((id) => ({ id })),
  edges: edges.map(([a, b, weight]) => ({
    id: [a, b].sort().join("-"),
    a,
    b,
    weight,
  })),
});
function referenceCost(graph, start, goal) {
  const distance = Object.fromEntries(graph.nodes.map((n) => [n.id, Infinity]));
  distance[start] = 0;
  for (let i = 0; i < graph.nodes.length - 1; i++)
    for (const e of graph.edges) {
      distance[e.b] = Math.min(distance[e.b], distance[e.a] + e.weight);
      distance[e.a] = Math.min(distance[e.a], distance[e.b] + e.weight);
    }
  return distance[goal];
}
test("the original garden graph distinguishes fewest edges from cheapest cost", () => {
  const graph = makeGraph();
  const bfs = runGraphSearch(graph, "bfs").at(-1),
    ucs = runGraphSearch(graph, "ucs").at(-1),
    astar = runGraphSearch(graph, "astar").at(-1),
    greedy = runGraphSearch(graph, "greedy").at(-1);
  assert.equal(bfs.path.length - 1, 3);
  assert.equal(bfs.cost, 13);
  assert.equal(ucs.cost, 7);
  assert.equal(astar.cost, 7);
  assert.deepEqual(ucs.path, ["S", "C", "E", "F", "G"]);
  assert.ok(astar.expansions < ucs.expansions);
  assert.ok(greedy.cost > ucs.cost);
});
test("all algorithms terminate on cycles and correctly report unreachable goals and identical endpoints", () => {
  for (const id of Object.keys(SEARCH_ALGORITHMS)) {
    const graph = makeGraph("islands"),
      frames = runGraphSearch(graph, id);
    assert.equal(frames.at(-1).found, false);
    assert.equal(frames.at(-1).cost, null);
    assert.equal(frames.at(-1).expansions, 6);
    const same = runGraphSearch(graph, id, "S", "S").at(-1);
    assert.equal(same.cost, 0);
    assert.deepEqual(same.path, ["S"]);
    assert.equal(same.expansions, 1);
  }
});
test("UCS accepts the goal on removal and updates a more expensive discovered route", () => {
  const graph = simple(
    ["S", "A", "G"],
    [
      ["S", "G", 9],
      ["S", "A", 1],
      ["A", "G", 1],
    ],
  );
  const frames = runGraphSearch(graph, "ucs");
  assert.equal(frames.at(-1).cost, 2);
  assert.deepEqual(frames.at(-1).path, ["S", "A", "G"]);
  assert.ok(frames.some((f) => f.type === "improve"));
});
test("A* reopens a state for an admissible but inconsistent heuristic", () => {
  const graph = simple(
      ["S", "A", "B", "G"],
      [
        ["S", "A", 3],
        ["S", "B", 1],
        ["B", "A", 1],
        ["A", "G", 3],
        ["B", "G", 10],
      ],
    ),
    h = { S: 0, A: 0, B: 4, G: 0 };
  assert.deepEqual(checkHeuristic(graph, "G", h), {
    admissible: true,
    consistent: false,
  });
  const frames = runGraphSearch(graph, "astar", "S", "G", h);
  assert.equal(frames.at(-1).cost, 5);
  assert.equal(
    frames.filter((f) => f.type === "expand" && f.active === "A").length,
    2,
  );
});
test("overestimates are detected and can make A* return a suboptimal route", () => {
  const graph = simple(
      ["S", "A", "G"],
      [
        ["S", "G", 4],
        ["S", "A", 1],
        ["A", "G", 1],
      ],
    ),
    h = { S: 0, A: 10, G: 0 };
  assert.equal(checkHeuristic(graph, "G", h).admissible, false);
  assert.equal(runGraphSearch(graph, "astar", "S", "G", h).at(-1).cost, 4);
  assert.equal(referenceCost(graph, "S", "G"), 2);
});
test("UCS and A* agree with an independent shortest-path reference for 48 weighted graphs", () => {
  let seed = 77;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed;
  };
  for (let trial = 0; trial < 48; trial++) {
    const graph = makeGraph(trial % 2 ? "garden" : "crossroads");
    graph.edges.forEach((e) => (e.weight = 1 + (rand() % 25)));
    const goal = trial % 3 ? "G" : "D",
      h = automaticHeuristic(graph, goal),
      expected = referenceCost(graph, "S", goal);
    assert.deepEqual(checkHeuristic(graph, goal, h), {
      admissible: true,
      consistent: true,
    });
    for (const algorithm of ["ucs", "astar"])
      assert.equal(
        runGraphSearch(graph, algorithm, "S", goal, h).at(-1).cost,
        expected,
      );
  }
});
test("frontier snapshots preserve FIFO / LIFO order and are independent when rewinding", () => {
  const graph = makeGraph(),
    bfs = runGraphSearch(graph, "bfs"),
    dfs = runGraphSearch(graph, "dfs");
  assert.deepEqual(
    bfs
      .filter((f) => f.type === "expand")
      .slice(0, 4)
      .map((f) => f.active),
    ["S", "A", "B", "C"],
  );
  assert.deepEqual(
    dfs
      .filter((f) => f.type === "expand")
      .slice(0, 3)
      .map((f) => f.active),
    ["S", "A", "D"],
  );
  assert.deepEqual(bfs[0].costs, { S: 0 });
  assert.equal(bfs[0].frontier.length, 1);
  assert.deepEqual(bfs[0].closed, []);
  for (const f of runGraphSearch(graph, "ucs"))
    for (let i = 1; i < f.frontier.length; i++)
      assert.ok(f.frontier[i - 1].g <= f.frontier[i].g);
});
