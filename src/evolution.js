export function seededRandom(seed = 42) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function attackingPairs(board) {
  const pairs = [];
  for (let a = 0; a < board.length; a++)
    for (let b = a + 1; b < board.length; b++)
      if (board[a] === board[b] || Math.abs(board[a] - board[b]) === b - a)
        pairs.push([a, b]);
  return pairs;
}
export function queenFitness(board) {
  let attacks = 0;
  for (let a = 0; a < board.length; a++) {
    for (let b = a + 1; b < board.length; b++) {
      if (board[a] === board[b] || Math.abs(board[a] - board[b]) === b - a)
        attacks++;
    }
  }
  return (board.length * (board.length - 1)) / 2 - attacks;
}
export function crossover(a, b, cut) {
  return [...a.slice(0, cut), ...b.slice(cut)];
}
export function mutate(board, rate, random) {
  const child = [...board],
    changes = [];
  child.forEach((row, col) => {
    if (random() < rate) {
      let next = Math.floor(random() * (child.length - 1));
      if (next >= row) next++;
      child[col] = next;
      changes.push({ col, from: row, to: next });
    }
  });
  return { child, changes };
}
export function runEvolution({
  size = 8,
  populationSize = 48,
  mutationRate = 0.12,
  generations = 200,
  selection = "tournament",
  seed = 42,
  initialBoard = null,
} = {}) {
  if (
    ![4, 6, 8, 10].includes(size) ||
    populationSize < 4 ||
    populationSize > 100 ||
    mutationRate < 0 ||
    mutationRate > 1 ||
    generations < 1 ||
    generations > 500 ||
    !["tournament", "roulette"].includes(selection)
  )
    throw Error("Invalid evolution settings");
  if (
    initialBoard &&
    (initialBoard.length !== size ||
      initialBoard.some((r) => !Number.isInteger(r) || r < 0 || r >= size))
  )
    throw Error("Invalid initial board");
  const random = seededRandom(seed),
    maxFitness = (size * (size - 1)) / 2;
  let nextId = 0;
  const score = (board) => ({
    id: nextId++,
    board: [...board],
    fitness: queenFitness(board),
  });
  let population = Array.from({ length: populationSize }, () =>
    score(Array.from({ length: size }, () => Math.floor(random() * size))),
  );
  if (initialBoard) population[0] = score(initialBoard);
  const frames = [];
  function snapshot(generation, trace = null) {
    population.sort((a, b) => b.fitness - a.fitness || a.id - b.id);
    const best = population[0];
    frames.push(
      structuredClone({
        generation,
        population,
        best,
        average:
          population.reduce((sum, p) => sum + p.fitness, 0) / populationSize,
        diversity: new Set(population.map((p) => p.board.join(","))).size,
        trace,
        solved: best.fitness === maxFitness,
        maxFitness,
        evaluations: populationSize + generation * (populationSize - 2),
      }),
    );
  }
  function pick() {
    if (selection === "roulette") {
      const total = population.reduce((s, p) => s + p.fitness + 1, 0);
      let needle = random() * total;
      for (const p of population) {
        needle -= p.fitness + 1;
        if (needle <= 0) return p;
      }
      return population.at(-1);
    }
    const candidates = Array.from(
      { length: 3 },
      () => population[Math.floor(random() * population.length)],
    );
    return candidates.reduce((best, p) =>
      p.fitness > best.fitness ? p : best,
    );
  }
  snapshot(0);
  for (
    let generation = 1;
    generation <= generations && !frames.at(-1).solved;
    generation++
  ) {
    const next = population.slice(0, 2); // Elitism retains the two best boards unchanged.
    let trace;
    while (next.length < populationSize) {
      const a = pick(),
        b = pick(),
        cut = 1 + Math.floor(random() * (size - 1));
      const crossed = crossover(a.board, b.board, cut);
      const { child, changes } = mutate(crossed, mutationRate, random);
      const offspring = score(child);
      // Trace a fittest actual newborn so the operators explain this generation's progress.
      if (!trace || offspring.fitness > trace.child.fitness)
        trace = { a, b, cut, crossed, child: offspring, changes };
      next.push(offspring);
    }
    population = next;
    snapshot(generation, trace);
  }
  return frames;
}
