export const LECTURE_VALUES = [2, 3, 5, 9, 0, 1, 7, 5];

export function labelFor(index) {
  let text = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    text = String.fromCharCode(65 + ((n - 1) % 26)) + text;
  return text;
}

export function buildTree(
  depth = 3,
  branching = 2,
  leaves = LECTURE_VALUES,
  rootMax = true,
) {
  if (![2, 3, 4].includes(depth) || ![2, 3].includes(branching))
    throw new Error("Unsupported tree size");
  if (
    leaves.length !== branching ** depth ||
    leaves.some((v) => !Number.isFinite(v))
  )
    throw new Error("Supply a finite value for every leaf");
  const nodes = [];
  let leafIndex = 0;
  function create(level, position, parent = null) {
    const id = nodes.length;
    const node = {
      id,
      label: "",
      level,
      parent,
      children: [],
      isMax: (level % 2 === 0) === rootMax,
      leaf: level === depth,
      x: (position + 0.5) / branching ** level,
    };
    nodes.push(node);
    if (node.leaf) {
      node.value = leaves[leafIndex];
      node.leafIndex = leafIndex++;
    } else
      for (let i = 0; i < branching; i++)
        node.children.push(create(level + 1, position * branching + i, id));
    return id;
  }
  create(0, 0);
  // Breadth-first labels match the lecture's A → B,C → D,E,F,G.
  [...nodes]
    .sort((a, b) => a.level - b.level || a.x - b.x)
    .forEach((node, i) => {
      node.label = labelFor(i);
    });
  return { nodes, depth, branching, rootMax, leafCount: leaves.length };
}

export const formatValue = (v) =>
  v === Infinity
    ? "+∞"
    : v === -Infinity
      ? "−∞"
      : v === undefined || v === null
        ? "—"
        : String(v);

export function runSearch(tree, pruning = true, direction = "left") {
  const { nodes } = tree;
  const state = {
    active: 0,
    statuses: {},
    values: {},
    bounds: {},
    valueTypes: {},
    bestChildren: {},
    visitedLeaves: 0,
    visitedNodes: 0,
    pruned: [],
    stack: [],
  };
  const frames = [];
  function emit(type, node, title, description, line, extra = {}) {
    state.active = node.id;
    frames.push(
      structuredClone({ ...state, type, title, description, line, ...extra }),
    );
  }
  emit(
    "ready",
    nodes[0],
    "Every decision starts here.",
    `Start at A. ${nodes[0].isMax ? "MAX wants the highest score" : "MIN wants the lowest score"}. Press play or take it one step at a time.`,
    0,
  );
  function skip(id) {
    state.statuses[id] = "pruned";
    state.pruned.push(id);
    nodes[id].children.forEach(skip);
  }
  function search(id, alpha, beta) {
    const node = nodes[id];
    state.stack.push(id);
    state.statuses[id] = "visiting";
    state.visitedNodes++;
    state.bounds[id] = { alpha, beta };
    emit(
      "visit",
      node,
      `Explore ${node.label}${node.leaf ? ", a terminal node" : `, a ${node.isMax ? "MAX" : "MIN"} node`}.`,
      node.leaf
        ? `This is a possible game outcome. Its utility is ${node.value}.`
        : `${node.isMax ? "MAX will keep the largest" : "MIN will keep the smallest"} value returned by its children.${pruning ? ` Inherited bounds: α = ${formatValue(alpha)}, β = ${formatValue(beta)}.` : ""}`,
      1,
    );
    if (node.leaf) {
      state.values[id] = node.value;
      state.visitedLeaves++;
      state.statuses[id] = "done";
      emit(
        "evaluate",
        node,
        `Read the leaf: ${node.value}.`,
        `Return ${node.value} to ${nodes[node.parent].label}. This leaf has now been evaluated.`,
        2,
      );
      state.stack.pop();
      return node.value;
    }
    let best = node.isMax ? -Infinity : Infinity;
    let cutoff = false;
    const children =
      direction === "right" ? [...node.children].reverse() : node.children;
    for (let i = 0; i < children.length; i++) {
      const child = nodes[children[i]];
      const result = search(child.id, alpha, beta);
      const improves = node.isMax ? result > best : result < best;
      if (improves || state.bestChildren[id] === undefined)
        state.bestChildren[id] = child.id;
      best = node.isMax ? Math.max(best, result) : Math.min(best, result);
      state.values[id] = best;
      if (pruning) {
        if (node.isMax) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
      }
      state.bounds[id] = { alpha, beta };
      emit(
        "update",
        node,
        `${node.label} keeps ${best}.`,
        `${child.label} returned ${result}. ${node.isMax ? "MAX chooses the larger" : "MIN chooses the smaller"} value, so the best score so far is ${best}.${pruning ? ` ${node.isMax ? "α" : "β"} becomes ${formatValue(node.isMax ? alpha : beta)}.` : ""}`,
        node.isMax ? 5 : 6,
        { from: child.id },
      );
      if (pruning && beta <= alpha && i < children.length - 1) {
        const skipped = children.slice(i + 1);
        skipped.forEach(skip);
        cutoff = true;
        state.valueTypes[id] = node.isMax ? "lower" : "upper";
        emit(
          "prune",
          node,
          `Cut off the remaining ${skipped.length === 1 ? "branch" : "branches"}.`,
          `β (${formatValue(beta)}) ≤ α (${formatValue(alpha)}). The remaining children of ${node.label} cannot improve the ancestor’s choice, so their entire subtrees are skipped.`,
          7,
        );
        break;
      }
    }
    state.statuses[id] = "done";
    emit(
      "return",
      node,
      `${node.label} returns ${best}.`,
      cutoff
        ? `This is a ${node.isMax ? "lower" : "upper"} bound on ${node.label}’s value; no further search is needed on this branch.`
        : `All necessary children have been considered. ${node.label}’s ${node.isMax ? "maximum" : "minimum"} value is ${best}.`,
      8,
    );
    state.stack.pop();
    return best;
  }
  const result = search(0, -Infinity, Infinity);
  emit(
    "complete",
    nodes[0],
    `The optimal value is ${result}.`,
    `With perfect play, ${nodes[0].isMax ? "MAX" : "MIN"} chooses ${nodes[state.bestChildren[0]].label}, guaranteeing ${result}. Evaluated ${state.visitedLeaves} of ${tree.leafCount} leaves${pruning ? `; skipped ${state.pruned.length} nodes` : ""}.`,
    9,
    { result },
  );
  return frames;
}

export function optimalPath(frame) {
  const path = [0];
  let current = 0;
  while (frame.bestChildren[current] !== undefined) {
    current = frame.bestChildren[current];
    path.push(current);
  }
  return path;
}
