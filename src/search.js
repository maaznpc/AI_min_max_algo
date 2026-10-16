export const SEARCH_ALGORITHMS = {
  bfs: {
    short: "BFS",
    name: "Breadth-first search",
    family: "Uninformed",
    rule: "First in, first out",
    frontier: "Queue",
    score: "depth",
    description:
      "Explore one layer at a time. The first route found uses the fewest edges, though it may not have the lowest weight.",
    complete: "Yes, on finite graphs",
    optimal: "With equal edge costs",
    time: "O(V + E)",
    space: "O(V)",
    treeTime: "O(bᵈ⁺¹)",
    treeSpace: "O(bᵈ⁺¹)",
  },
  dfs: {
    short: "DFS",
    name: "Depth-first search",
    family: "Uninformed",
    rule: "Last in, first out",
    frontier: "Stack",
    score: "depth",
    description:
      "Follow a branch as far as it goes, then backtrack. A visited set prevents cycling in this finite graph.",
    complete: "Yes here; not on infinite trees",
    optimal: "No guarantee",
    time: "O(V + E)",
    space: "O(V)",
    treeTime: "O(bᵐ)",
    treeSpace: "O(bm)",
  },
  ucs: {
    short: "UCS",
    name: "Uniform-cost search",
    family: "Uninformed",
    rule: "Lowest path cost first",
    frontier: "Priority queue",
    score: "g",
    description:
      "Always expand the cheapest route so far. A goal is accepted when removed from the frontier, not when first discovered.",
    complete: "Yes, with positive costs",
    optimal: "Yes, with nonnegative costs",
    time: "O((V + E) log V)",
    space: "O(V + E)",
    treeTime: "O(b¹⁺⌊C*/ε⌋)",
    treeSpace: "O(b¹⁺⌊C*/ε⌋)",
  },
  astar: {
    short: "A*",
    name: "A* search",
    family: "Informed",
    rule: "Lowest g(n) + h(n) first",
    frontier: "Priority queue",
    score: "f",
    description:
      "Balance the cost already paid with an estimate of the cost remaining. A good lower-bound heuristic focuses the search without losing the cheapest route.",
    complete: "Yes, with positive costs",
    optimal: "With an admissible heuristic¹",
    time: "Heuristic-dependent²",
    space: "O(V + E), consistent h",
    treeTime: "Exponential in the worst case",
    treeSpace: "Exponential in the worst case",
  },
  greedy: {
    short: "Greedy",
    name: "Greedy best-first search",
    family: "Informed",
    rule: "Lowest estimate h(n) first",
    frontier: "Priority queue",
    score: "h",
    description:
      "Head toward the node that seems closest to the goal. Ignoring the cost already paid can lead to an expensive detour.",
    complete: "Yes here; not on infinite trees",
    optimal: "No guarantee",
    time: "O((V + E) log V)",
    space: "O(V + E)",
    treeTime: "O(bᵐ)",
    treeSpace: "O(bᵐ)",
  },
};

export const GRAPH_PRESETS = {
  garden: {
    name: "The garden paths",
    nodes: [
      ["S", 85, 210],
      ["A", 265, 78],
      ["B", 265, 210],
      ["C", 265, 342],
      ["D", 470, 80],
      ["E", 470, 340],
      ["F", 535, 210],
      ["G", 735, 210],
    ],
    edges: [
      ["S", "A", 2],
      ["S", "B", 4],
      ["S", "C", 1],
      ["A", "B", 1],
      ["A", "D", 4],
      ["B", "D", 2],
      ["B", "E", 5],
      ["C", "E", 2],
      ["D", "F", 2],
      ["E", "F", 2],
      ["D", "G", 7],
      ["E", "G", 9],
      ["F", "G", 2],
    ],
  },
  crossroads: {
    name: "The winding crossroads",
    nodes: [
      ["S", 75, 210],
      ["A", 235, 75],
      ["B", 235, 210],
      ["C", 235, 345],
      ["D", 420, 75],
      ["E", 420, 345],
      ["F", 580, 110],
      ["H", 580, 310],
      ["G", 750, 210],
    ],
    edges: [
      ["S", "A", 3],
      ["S", "B", 2],
      ["S", "C", 5],
      ["A", "D", 2],
      ["B", "D", 2],
      ["B", "E", 3],
      ["C", "E", 1],
      ["D", "E", 2],
      ["D", "F", 4],
      ["E", "H", 2],
      ["F", "G", 5],
      ["H", "G", 2],
      ["F", "H", 1],
    ],
  },
  islands: {
    name: "An unreachable island",
    nodes: [
      ["S", 85, 210],
      ["A", 265, 78],
      ["B", 265, 210],
      ["C", 265, 342],
      ["D", 480, 110],
      ["E", 480, 310],
      ["G", 735, 210],
    ],
    edges: [
      ["S", "A", 2],
      ["S", "B", 3],
      ["S", "C", 1],
      ["A", "B", 1],
      ["A", "D", 3],
      ["B", "D", 2],
      ["B", "E", 2],
      ["C", "E", 4],
      ["D", "E", 1],
    ],
  },
};

export function makeGraph(preset = "garden") {
  const graph = GRAPH_PRESETS[preset];
  return {
    nodes: graph.nodes.map(([id, x, y]) => ({ id, x, y })),
    edges: graph.edges.map(([a, b, weight]) => ({
      id: [a, b].sort().join("-"),
      a,
      b,
      weight,
    })),
  };
}
export const edgeKey = (a, b) => [a, b].sort().join("-");
export function neighbors(graph, id) {
  return graph.edges
    .filter((e) => e.a === id || e.b === id)
    .map((e) => ({ id: e.a === id ? e.b : e.a, weight: e.weight, edge: e.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// Independent reverse shortest distances supply a known lower bound for teaching.
export function distancesToGoal(graph, goal) {
  const distances = Object.fromEntries(
    graph.nodes.map((n) => [n.id, Infinity]),
  );
  distances[goal] = 0;
  const remaining = new Set(graph.nodes.map((n) => n.id));
  while (remaining.size) {
    const id = [...remaining].sort((a, b) => distances[a] - distances[b])[0];
    remaining.delete(id);
    if (!Number.isFinite(distances[id])) break;
    for (const next of neighbors(graph, id))
      distances[next.id] = Math.min(
        distances[next.id],
        distances[id] + next.weight,
      );
  }
  return distances;
}
export function automaticHeuristic(graph, goal) {
  return Object.fromEntries(
    Object.entries(distancesToGoal(graph, goal)).map(([id, d]) => [
      id,
      Number.isFinite(d) ? Math.floor(d * 0.85) : 0,
    ]),
  );
}
export function checkHeuristic(graph, goal, h) {
  const distances = distancesToGoal(graph, goal);
  return {
    admissible:
      h[goal] === 0 &&
      graph.nodes.every(
        (n) =>
          Number.isFinite(h[n.id]) &&
          h[n.id] >= 0 &&
          h[n.id] <= distances[n.id],
      ),
    consistent:
      graph.edges.every((e) => Math.abs(h[e.a] - h[e.b]) <= e.weight) &&
      h[goal] === 0,
  };
}

class MinHeap {
  data = [];
  push(item) {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(item, this.data[parent])) break;
      this.data[i] = this.data[parent];
      i = parent;
    }
    this.data[i] = item;
  }
  less(a, b) {
    return (
      a.priority < b.priority ||
      (a.priority === b.priority && a.order < b.order)
    );
  }
  pop() {
    const top = this.data[0],
      end = this.data.pop();
    if (this.data.length) {
      let i = 0;
      while (i * 2 + 1 < this.data.length) {
        let c = i * 2 + 1;
        if (
          c + 1 < this.data.length &&
          this.less(this.data[c + 1], this.data[c])
        )
          c++;
        if (!this.less(this.data[c], end)) break;
        this.data[i] = this.data[c];
        i = c;
      }
      this.data[i] = end;
    }
    return top;
  }
}

export function runGraphSearch(
  graph,
  algorithm = "bfs",
  start = "S",
  goal = "G",
  heuristic = automaticHeuristic(graph, goal),
) {
  if (!SEARCH_ALGORITHMS[algorithm]) throw Error("Unknown search algorithm");
  if (
    !graph.nodes.some((n) => n.id === start) ||
    !graph.nodes.some((n) => n.id === goal)
  )
    throw Error("Choose valid start and goal nodes");
  if (graph.edges.some((e) => !Number.isFinite(e.weight) || e.weight <= 0))
    throw Error("Use positive finite edge weights");
  const info = SEARCH_ALGORITHMS[algorithm];
  const priorityMode = ["ucs", "astar", "greedy"].includes(algorithm);
  const weighted = ["ucs", "astar"].includes(algorithm);
  const open = new Map(),
    queue = [],
    heap = new MinHeap(),
    closed = new Set(),
    discovered = new Set([start]);
  const adjacency = Object.fromEntries(graph.nodes.map((n) => [n.id, []]));
  for (const edge of graph.edges) {
    adjacency[edge.a].push({ id: edge.b, weight: edge.weight, edge: edge.id });
    adjacency[edge.b].push({ id: edge.a, weight: edge.weight, edge: edge.id });
  }
  Object.values(adjacency).forEach((list) =>
    list.sort((a, b) => a.id.localeCompare(b.id)),
  );
  let queueHead = 0;
  let order = 0,
    expansions = 0,
    peak = 1;
  const costs = { [start]: 0 },
    parents = {},
    history = [];
  let active = null,
    activeEdge = null;
  const priority = (g, h, depth) =>
    algorithm === "astar"
      ? g + h
      : algorithm === "ucs"
        ? g
        : algorithm === "greedy"
          ? h
          : depth;
  function add(id, g, depth) {
    const item = { id, g, h: heuristic[id] ?? 0, depth, order: order++ };
    item.f = item.g + item.h;
    item.priority = priority(item.g, item.h, depth);
    open.set(id, item);
    if (priorityMode) heap.push(item);
    else queue.push(item);
    peak = Math.max(peak, open.size);
  }
  function frontier() {
    if (priorityMode)
      return [...open.values()].sort(
        (a, b) => a.priority - b.priority || a.order - b.order,
      );
    const valid = (algorithm === "bfs" ? queue.slice(queueHead) : queue).filter(
      (item) => open.get(item.id) === item,
    );
    return algorithm === "dfs" ? [...valid].reverse() : valid;
  }
  function pathTo(id) {
    const path = [id];
    while (parents[path[0]] !== undefined) path.unshift(parents[path[0]]);
    return path;
  }
  function emit(type, title, description, line, extra = {}) {
    history.push(
      structuredClone({
        type,
        title,
        description,
        line,
        active,
        activeEdge,
        frontier: frontier(),
        closed: [...closed],
        discovered: [...discovered],
        costs,
        parents,
        expansions,
        peak,
        path: [],
        ...extra,
      }),
    );
  }
  add(start, 0, 0);
  emit(
    "ready",
    "Every route starts somewhere.",
    `Find a route from ${start} to ${goal}. ${info.name} uses a ${info.frontier.toLowerCase()}: ${info.rule.toLowerCase()}.`,
    0,
  );
  while (open.size) {
    let item;
    do {
      item = priorityMode
        ? heap.pop()
        : algorithm === "dfs"
          ? queue.pop()
          : queue[queueHead++];
    } while (item && open.get(item.id) !== item);
    if (!item) break;
    open.delete(item.id);
    active = item.id;
    activeEdge = null;
    closed.add(item.id);
    expansions++;
    emit(
      "expand",
      `Take ${item.id} from the ${info.frontier.toLowerCase()}.`,
      priorityMode
        ? `${info.short} selects the smallest ${info.score}(n). At ${item.id}: g = ${item.g}, h = ${item.h}, f = ${item.f}.`
        : `${algorithm === "bfs" ? "The oldest discovered node goes first" : "The most recently added node goes first"}. Its route has ${item.depth} edges and a cost of ${item.g}.`,
      1,
    );
    if (item.id === goal) {
      const path = pathTo(goal);
      emit(
        "goal",
        `Goal reached. Route cost: ${item.g}.`,
        `${path.join(" → ")}. ${path.length - 1} edges, ${expansions} nodes expanded. ${algorithm === "bfs" ? "This is a fewest-edge route; weights may make another route cheaper." : algorithm === "dfs" || algorithm === "greedy" ? "A route is found, but this method does not guarantee minimum cost." : "The goal is accepted when removed from the priority queue."}`,
        2,
        { path, cost: item.g, found: true },
      );
      return history;
    }
    const nextNodes = [...adjacency[item.id]];
    if (algorithm === "dfs") nextNodes.reverse();
    for (const next of nextNodes) {
      const g = item.g + next.weight;
      activeEdge = next.edge;
      const known = discovered.has(next.id);
      if (!known || (weighted && g < costs[next.id])) {
        const old = costs[next.id];
        costs[next.id] = g;
        parents[next.id] = item.id;
        discovered.add(next.id);
        if (closed.has(next.id)) closed.delete(next.id); // A* reopens improved states for inconsistent admissible heuristics.
        add(next.id, g, item.depth + 1);
        emit(
          known ? "improve" : "discover",
          known
            ? `A cheaper route to ${next.id}.`
            : `Add ${next.id} to the frontier.`,
          `${item.id} → ${next.id} costs ${next.weight}; the route so far costs ${g}.${known ? ` Previous cost: ${old}. Update its parent and priority.` : ""}${algorithm === "dfs" ? " Neighbors are pushed in reverse alphabetical order so the alphabetically first is explored next." : ""}`,
          known ? 4 : 3,
        );
      } else {
        emit(
          "skip",
          `Keep the existing route to ${next.id}.`,
          weighted
            ? `This candidate costs ${g}; the known route costs ${costs[next.id]}. It cannot improve the current route.`
            : `${next.id} has already been discovered. The visited set prevents repeated states and cycles.`,
          5,
        );
      }
    }
    activeEdge = null;
  }
  emit(
    "failed",
    "The frontier is empty.",
    `There is no route from ${start} to ${goal} in this graph. All ${expansions} reachable nodes were expanded.`,
    6,
    { found: false, cost: null },
  );
  return history;
}
