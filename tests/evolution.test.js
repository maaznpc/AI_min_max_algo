import test from "node:test";
import assert from "node:assert/strict";
import {
  attackingPairs,
  queenFitness,
  seededRandom,
  mutate,
  crossover,
  runEvolution,
} from "../src/evolution.js";
test("queen fitness counts row and diagonal attacks exactly", () => {
  assert.equal(queenFitness([1, 3, 0, 2]), 6);
  assert.deepEqual(attackingPairs([1, 3, 0, 2]), []);
  assert.equal(queenFitness([0, 1, 2, 3]), 0);
  assert.equal(attackingPairs([0, 0, 0, 0]).length, 6);
  assert.equal(queenFitness([0, 0, 2, 3]), 2);
});
test("crossover preserves source genes and mutation never leaves the board or keeps a mutated row", () => {
  assert.deepEqual(crossover([0, 1, 2, 3], [3, 2, 1, 0], 2), [0, 1, 1, 0]);
  const board = [0, 1, 2, 3],
    none = mutate(board, 0, seededRandom(1)),
    all = mutate(board, 1, seededRandom(1));
  assert.deepEqual(none.child, board);
  assert.equal(none.changes.length, 0);
  assert.equal(all.changes.length, 4);
  all.child.forEach((row, col) => {
    assert.notEqual(row, board[col]);
    assert.ok(row >= 0 && row < 4);
  });
  assert.deepEqual(board, [0, 1, 2, 3]);
});
test("the demonstration seed genuinely evolves a verified 8-queens solution", () => {
  const frames = runEvolution({ seed: 12 });
  assert.equal(frames.at(-1).solved, true);
  assert.equal(frames.at(-1).best.fitness, 28);
  assert.equal(attackingPairs(frames.at(-1).best.board).length, 0);
  assert.ok(frames.length > 2);
  const second = runEvolution({ seed: 12 });
  assert.deepEqual(frames, second);
});
test("every generation preserves elites, valid chromosomes and the real offspring operator trace", () => {
  for (const selection of ["tournament", "roulette"]) {
    const frames = runEvolution({
      size: 6,
      populationSize: 24,
      generations: 30,
      selection,
      seed: 33,
    });
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      assert.equal(f.population.length, 24);
      assert.equal(f.best.fitness, queenFitness(f.best.board));
      for (const p of f.population) {
        assert.equal(p.board.length, 6);
        assert.ok(p.board.every((r) => Number.isInteger(r) && r >= 0 && r < 6));
        assert.equal(p.fitness, queenFitness(p.board));
      }
      if (i) {
        const prev = frames[i - 1];
        assert.ok(f.best.fitness >= prev.best.fitness);
        assert.ok(f.population.some((p) => p.id === prev.population[0].id));
        assert.ok(f.population.some((p) => p.id === prev.population[1].id));
        assert.deepEqual(
          f.trace.crossed,
          crossover(f.trace.a.board, f.trace.b.board, f.trace.cut),
        );
        const expected = [...f.trace.crossed];
        f.trace.changes.forEach((c) => (expected[c.col] = c.to));
        assert.deepEqual(expected, f.trace.child.board);
        assert.ok(f.population.some((p) => p.id === f.trace.child.id));
      }
    }
  }
});
test("generation caps remain unsolved outcomes and a manual board really enters the initial population", () => {
  const limited = runEvolution({ seed: 42, generations: 1 });
  assert.equal(limited.length, 2);
  assert.equal(limited.at(-1).solved, false);
  const board = [1, 3, 0, 2],
    manual = runEvolution({ size: 4, initialBoard: board });
  assert.equal(manual.length, 1);
  assert.equal(manual[0].solved, true);
  assert.deepEqual(manual[0].best.board, board);
  assert.throws(() => runEvolution({ size: 8, initialBoard: [1, 2] }));
});
