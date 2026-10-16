import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Crown,
  Dna,
  Eye,
  GitMerge,
  MousePointer2,
  Play,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Header,
  Footer,
  Playback,
  Modal,
  WorkspaceHeading,
  usePlayback,
} from "./shared";
import { runEvolution, attackingPairs, queenFitness } from "./evolution";

export default function QueensPage() {
  const [size, setSize] = useState(8),
    [populationSize, setPopulationSize] = useState(48),
    [mutationRate, setMutationRate] = useState(0.12),
    [selection, setSelection] = useState("tournament"),
    [limit, setLimit] = useState(200),
    [seed, setSeed] = useState(12);
  const [initialBoard, setInitialBoard] = useState(null),
    [manualBoard, setManualBoard] = useState([0, 4, 2, 5, 1, 6, 3, 7]),
    [mode, setMode] = useState("evolve"),
    [showAttacks, setShowAttacks] = useState(true),
    [selectedId, setSelectedId] = useState(null),
    [modal, setModal] = useState(false),
    [autoStart, setAutoStart] = useState(false);
  const frames = useMemo(
    () =>
      runEvolution({
        size,
        populationSize,
        mutationRate,
        selection,
        generations: limit,
        seed,
        initialBoard,
      }),
    [size, populationSize, mutationRate, selection, limit, seed, initialBoard],
  );
  const p = usePlayback(frames, { interval: 500, enabled: mode === "evolve" }),
    f = p.frame;
  useEffect(() => {
    setSelectedId(null);
  }, [p.step, frames]);
  useEffect(() => {
    if (autoStart) {
      p.setPlaying(true);
      setAutoStart(false);
    }
  }, [frames, autoStart]);
  const individual = f.population.find((v) => v.id === selectedId) ?? f.best;
  const board = mode === "manual" ? manualBoard : individual.board;
  const pairs = attackingPairs(board),
    fitness = queenFitness(board),
    max = (size * (size - 1)) / 2;
  const solved = fitness === max;
  function resize(n) {
    setSize(n);
    setInitialBoard(null);
    setManualBoard(Array.from({ length: n }, (_, i) => i));
    setSelectedId(null);
    setMode("evolve");
  }
  function newRun() {
    setInitialBoard(null);
    setSeed((v) => v + 1);
    setMode("evolve");
    setSelectedId(null);
  }
  function tryBoard() {
    setManualBoard([...board]);
    p.setPlaying(false);
    setMode("manual");
  }
  function evolveBoard() {
    setInitialBoard([...manualBoard]);
    setSeed((v) => v + 1);
    setMode("evolve");
    setAutoStart(true);
  }
  const scrollTheory = () =>
    document
      .getElementById("evolution-working")
      .scrollIntoView({ behavior: "smooth" });
  return (
    <>
      <Header
        active="queens"
        onGuide={() => setModal(true)}
        onConcepts={scrollTheory}
      />
      <main className="new-page queens-page">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span />
              THE EVOLUTION PLAYGROUND
            </div>
            <h1>
              Better boards. <span>One generation at a time.</span>
            </h1>
            <p>
              A little selection. A little mutation. A smarter way to place{" "}
              {size} queens.
            </p>
          </div>
          <button className="how-button" onClick={() => setModal(true)}>
            <span className="small-play">
              <Play size={13} fill="currentColor" />
            </span>
            How does it work?
            <ArrowUpRight size={15} />
          </button>
        </section>
        <WorkspaceHeading right="Let good ideas evolve." />
        <section
          className="workspace queens-workspace"
          aria-label="Evolutionary N-Queens playground"
        >
          <aside className="settings">
            <div className="panel-heading">
              <SlidersHorizontal size={16} />
              <h2>Your experiment</h2>
              <button
                aria-label="Reset evolution settings"
                onClick={() => {
                  setSize(8);
                  setPopulationSize(48);
                  setMutationRate(0.12);
                  setSelection("tournament");
                  setLimit(200);
                  setSeed(12);
                  setInitialBoard(null);
                  setMode("evolve");
                  p.reset();
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div className="queen-sidebar-title">
              <span className="concept-icon">
                <Crown size={20} />
              </span>
              <h3>The {size}-queens challenge</h3>
              <p>
                Place one queen per column.
                <br />
                Let no two queens attack.
              </p>
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="board-size">
                Board size
              </label>
              <div className="board-size-buttons">
                {[4, 6, 8, 10].map((n) => (
                  <button
                    key={n}
                    aria-label={`${n} by ${n} board`}
                    aria-pressed={n === size}
                    className={n === size ? "selected" : ""}
                    onClick={() => resize(n)}
                  >
                    {n} × {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="population-size">
                Population<span>{populationSize} boards</span>
              </label>
              <input
                id="population-size"
                className="setting-range"
                type="range"
                min="12"
                max="96"
                step="12"
                value={populationSize}
                onChange={(e) => {
                  setPopulationSize(Number(e.target.value));
                  setMode("evolve");
                }}
              />
              <div className="range-labels">
                <span>12 · a small pool</span>
                <span>96 · more variety</span>
              </div>
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="mutation-rate">
                Mutation rate
                <span>{Math.round(mutationRate * 100)}% per gene</span>
              </label>
              <input
                id="mutation-rate"
                className="setting-range"
                type="range"
                min="0"
                max="50"
                value={Math.round(mutationRate * 100)}
                onChange={(e) => {
                  setMutationRate(Number(e.target.value) / 100);
                  setMode("evolve");
                }}
              />
              <div className="range-labels">
                <span>Preserve</span>
                <span>Explore</span>
              </div>
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="selection-method">
                Parent selection
              </label>
              <div className="select-wrap">
                <select
                  id="selection-method"
                  value={selection}
                  onChange={(e) => {
                    setSelection(e.target.value);
                    setMode("evolve");
                  }}
                >
                  <option value="tournament">Tournament · best of 3</option>
                  <option value="roulette">Roulette · fitness-weighted</option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="setting-row">
              <div>
                <label className="field-label" htmlFor="generation-limit">
                  Generation limit
                </label>
                <div className="select-wrap">
                  <select
                    id="generation-limit"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setMode("evolve");
                    }}
                  >
                    {[50, 100, 200, 500].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="random-seed">
                  Random seed
                </label>
                <input
                  className="seed-input"
                  id="random-seed"
                  type="number"
                  min="0"
                  max="99999"
                  value={seed}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isInteger(v) && v >= 0 && v <= 99999) {
                      setSeed(v);
                      setMode("evolve");
                    }
                  }}
                />
              </div>
            </div>
            <div className="elitism-note">
              <Check size={13} />
              <span>Best 2 boards always survive.</span>
            </div>
            <button className="randomize" onClick={newRun}>
              <Shuffle size={14} />
              New random population
            </button>
            <div className="settings-note">
              <Sparkles size={16} />
              <p>
                Evolution explores, not promises.
                <br />
                Some runs need another try.
              </p>
            </div>
          </aside>
          <div className="visual-area">
            <div className="canvas-toolbar">
              <div role="tablist" aria-label="Queens mode">
                <button
                  role="tab"
                  aria-selected={mode === "evolve"}
                  className={mode === "evolve" ? "active" : ""}
                  onClick={() => {
                    setMode("evolve");
                    setSelectedId(null);
                  }}
                >
                  <Dna size={15} />
                  Evolution lab
                </button>
                <button
                  role="tab"
                  aria-selected={mode === "manual"}
                  className={mode === "manual" ? "active" : ""}
                  onClick={tryBoard}
                >
                  <MousePointer2 size={15} />
                  Try it yourself
                </button>
              </div>
              <span className="tree-size">
                {size} queens · {max} pairs
              </span>
            </div>
            <div className="queens-canvas">
              <div className="canvas-topline">
                <span className="canvas-label">
                  {mode === "manual"
                    ? "YOUR BOARD"
                    : selectedId !== null
                      ? "POPULATION CANDIDATE"
                      : "BEST OF THE GENERATION"}
                </span>
                <span
                  className={`status-pill ${p.playing && mode === "evolve" ? "is-running" : solved ? "is-complete" : ""}`}
                >
                  <span />
                  {solved
                    ? "No conflicts"
                    : mode === "manual"
                      ? "Your move"
                      : p.playing
                        ? "Evolving"
                        : p.step === p.last
                          ? f.solved
                            ? "Solution found"
                            : "Limit reached"
                          : "Ready to evolve"}
                </span>
              </div>
              <div className="board-container">
                <ChessBoard
                  board={board}
                  pairs={pairs}
                  showAttacks={showAttacks}
                  onMove={(col, row) => {
                    if (mode !== "manual") {
                      setManualBoard(
                        board.map((value, i) => (i === col ? row : value)),
                      );
                      setMode("manual");
                    } else
                      setManualBoard((board) =>
                        board.map((value, i) => (i === col ? row : value)),
                      );
                    p.setPlaying(false);
                  }}
                />
              </div>
              <div className="board-caption">
                <span>
                  <MousePointer2 size={12} />
                  Click a square to move its column’s queen.
                </span>
                <button
                  aria-pressed={showAttacks}
                  onClick={() => setShowAttacks((v) => !v)}
                >
                  <Eye size={13} />
                  {showAttacks ? "Hide" : "Show"} conflicts
                </button>
              </div>
              <div className="chromosome-caption">
                <span>CHROMOSOME</span>
                <Genes board={board} />
                <span>One row per column · 1-indexed</span>
              </div>
              {mode === "manual" && (
                <div
                  className={`manual-banner ${solved ? "manual-solved" : ""}`}
                >
                  <span>
                    {solved ? (
                      <>
                        <Check size={15} />
                        You found a valid solution.
                      </>
                    ) : (
                      <>
                        <Crown size={15} />
                        {pairs.length} attacking{" "}
                        {pairs.length === 1 ? "pair" : "pairs"}. Keep
                        experimenting.
                      </>
                    )}
                  </span>
                  <button onClick={evolveBoard}>
                    Evolve from my board
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
            {mode === "evolve" ? (
              <Playback
                playback={p}
                unit="Generation"
                playLabel="Evolve"
                nextLabel="Next generation"
                previousLabel="Previous generation"
              />
            ) : (
              <div className="manual-controls">
                <button
                  onClick={() =>
                    setManualBoard(
                      Array.from({ length: size }, () =>
                        Math.floor(Math.random() * size),
                      ),
                    )
                  }
                >
                  <Shuffle size={14} />
                  Shuffle my board
                </button>
                <button
                  onClick={() => {
                    setManualBoard(Array.from({ length: size }, (_, i) => i));
                  }}
                >
                  <RotateCcw size={14} />
                  Reset my board
                </button>
              </div>
            )}
          </div>
          <aside className="inspector queens-inspector">
            <div className="panel-heading">
              <span className="live-dot" />
              <h2>Room for improvement</h2>
            </div>
            <div className="step-story">
              <div className="step-kicker">
                {mode === "manual"
                  ? "YOUR ARRANGEMENT"
                  : `GENERATION ${String(f.generation).padStart(2, "0")}`}
                <Crown size={15} />
              </div>
              <h3>
                {solved
                  ? "All queens. No quarrels."
                  : mode === "manual"
                    ? "Every queen needs her space."
                    : p.step === p.last && !f.solved
                      ? "A plateau is part of the story."
                      : f.generation === 0
                        ? "Good solutions start with variety."
                        : "Keep the good. Explore the new."}
              </h3>
              <p aria-live="polite">
                {solved
                  ? `All ${max} pairs are non-attacking. This is a valid ${size}-queens solution.`
                  : mode === "manual"
                    ? "Move a queen within its column. Attacking pairs share a row or a diagonal."
                    : p.step === p.last && !f.solved
                      ? `The ${limit}-generation limit was reached with ${max - f.best.fitness} conflicts remaining. Try a new population, more generations, or a different mutation rate.`
                      : f.generation === 0
                        ? `${populationSize} random boards form the starting population. Fitter boards are more likely to become parents.`
                        : `Selection, crossover, and mutation created ${populationSize - 2} new boards. The best two from the previous generation were kept unchanged.`}
              </p>
            </div>
            <div className="fitness-display">
              <div>
                <span>FITNESS SCORE</span>
                <strong>
                  {fitness}
                  <small> / {max}</small>
                </strong>
              </div>
              <span
                className={solved ? "fitness-ring solved-ring" : "fitness-ring"}
                style={{ "--fitness": `${(fitness / max) * 100}%` }}
              >
                <Crown size={23} />
              </span>
            </div>
            <div className="fitness-progress">
              <span style={{ width: `${(fitness / max) * 100}%` }} />
            </div>
            <div className="queen-metrics">
              <div>
                <span>Attacking pairs</span>
                <strong
                  className={pairs.length ? "conflict-count" : "safe-count"}
                >
                  {pairs.length}
                </strong>
              </div>
              <div>
                <span>Population average</span>
                <strong>
                  {f.average.toFixed(1)}
                  <small> / {max}</small>
                </strong>
              </div>
              <div>
                <span>Unique boards</span>
                <strong>
                  {f.diversity}
                  <small> / {populationSize}</small>
                </strong>
              </div>
              <div>
                <span>Fitness evaluations</span>
                <strong>{f.evaluations.toLocaleString()}</strong>
              </div>
            </div>
            <div className="fitness-chart">
              <div className="inspector-label">
                EVOLUTION SO FAR<span>Best · Average</span>
              </div>
              <FitnessChart frames={frames.slice(0, p.step + 1)} max={max} />
              <div className="chart-legend">
                <span>
                  <i />
                  Best fitness
                </span>
                <span>
                  <i />
                  Average
                </span>
              </div>
            </div>
            <button className="code-button" onClick={scrollTheory}>
              <Dna size={16} />
              <span>See how this generation works</span>
              <ArrowUpRight size={14} />
            </button>
            <p className="inspector-tip">Rewind to inspect any generation.</p>
          </aside>
        </section>
        <div className="under-workspace">
          <span>
            <span className="keyboard-key">←</span>
            <span className="keyboard-key">→</span>one generation at a time
            <i />
            <span className="keyboard-key">space</span>evolve / pause
          </span>
          <span>
            Small mutations. New possibilities.
            <Sparkles size={13} />
          </span>
        </div>
        <section className="evolution-working" id="evolution-working">
          <div className="learn-intro">
            <div className="eyebrow">OPEN UP THE BLACK BOX</div>
            <h2>A closer look at generation {f.generation}.</h2>
            <p>Real parents. Real operators. One actual offspring.</p>
          </div>
          {f.trace && (
            <div className="operator-context">
              <span>
                Tracing a fittest newborn (fitness {f.trace.child.fitness}). Two
                elites and the other offspring complete the generation.
              </span>
              <button
                onClick={() => {
                  setSelectedId(f.trace.child.id);
                  setMode("evolve");
                  p.setPlaying(false);
                  document
                    .querySelector(".queens-workspace")
                    .scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Inspect this offspring <ArrowUpRight size={12} />
              </button>
            </div>
          )}
          <div className="evolution-pipeline">
            <OperatorTrace
              frame={f}
              selection={selection}
              rate={mutationRate}
            />
          </div>
          <div className="population-section">
            <div className="population-heading">
              <div>
                <span className="eyebrow">THE LIVING POPULATION</span>
                <h3>{populationSize} possibilities. One shared goal.</h3>
              </div>
              <span>Showing the 8 fittest · click to inspect on the board</span>
            </div>
            <div className="population-cards">
              {f.population.slice(0, 8).map((candidate, i) => (
                <button
                  key={candidate.id}
                  className={`population-card ${individual.id === candidate.id && mode === "evolve" ? "selected-candidate" : ""}`}
                  aria-label={`Inspect candidate ${i + 1}, fitness ${candidate.fitness}`}
                  onClick={() => {
                    setSelectedId(candidate.id);
                    setMode("evolve");
                    p.setPlaying(false);
                    document
                      .querySelector(".queens-workspace")
                      .scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <div>
                    <span>#{String(i + 1).padStart(2, "0")}</span>
                    {i === 0 && <Crown size={11} />}
                    <strong>
                      {candidate.fitness}
                      <small> / {max}</small>
                    </strong>
                  </div>
                  <MiniBoard board={candidate.board} />
                  <span className="population-genes">
                    {candidate.board.map((n) => n + 1).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="learn-intro evolution-theory-title">
            <div className="eyebrow">A LITTLE THEORY, A LOT OF CLARITY</div>
            <h2>Improvement is a process.</h2>
          </div>
          <div className="concept-cards evolution-concepts">
            <article>
              <span className="concept-icon">
                <Target size={20} />
              </span>
              <span className="concept-number">01 / THE FITNESS</span>
              <h3>Count the peaceful pairs.</h3>
              <p>
                One gene stores the row of a queen in its column, so column
                conflicts are impossible. Count row and diagonal attacks;
                subtract them from all possible pairs.
              </p>
              <div className="concept-footnote">
                <code>fitness = n(n − 1) / 2 − attacks</code>
              </div>
            </article>
            <article>
              <span className="concept-icon">
                <GitMerge size={20} />
              </span>
              <span className="concept-number">02 / THE VARIATION</span>
              <h3>Inherit. Then improvise.</h3>
              <p>
                {selection === "tournament"
                  ? "Tournament selection picks the best of 3 random candidates."
                  : "Roulette selection samples parents in proportion to fitness + 1, so zero-fitness boards still have a chance."}{" "}
                One-point crossover mixes parents. Each gene then mutates
                independently with probability {Math.round(mutationRate * 100)}
                %.
              </p>
              <div className="concept-footnote">
                Two elites survive unchanged every generation.
              </div>
            </article>
            <article>
              <span className="concept-icon prune-icon">
                <TrendingUp size={20} />
              </span>
              <span className="concept-number">03 / THE TRADE-OFF</span>
              <h3>Progress without a promise.</h3>
              <p>
                Elitism makes the best fitness nondecreasing. A finite run can
                still stall. A conflict-free board is a verified solution;
                reaching the limit is not a solution.
              </p>
              <div className="concept-footnote">
                Stop at perfect fitness or the generation limit.
              </div>
            </article>
          </div>
          <div className="property-cards evolutionary-properties">
            {[
              [
                "Complete?",
                "Not guaranteed",
                "Stochastic search can miss a valid solution.",
              ],
              [
                "Optimal?",
                "A perfect score solves it",
                "No global convergence guarantee in a finite run.",
              ],
              [
                "Time / generation",
                "O(Pn² + P log P)",
                "Pairwise scoring plus population sorting.",
              ],
              [
                "Core space",
                "O(Pn)",
                "Animation history additionally stores O(GPn).",
              ],
            ].map(([label, value, note]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </article>
            ))}
          </div>
          <p className="theory-small evolution-notation">
            n = queens; P = population size; G = recorded generations. Total
            time is O(G(Pn² + P log P)). The initial candidate pool is random;
            no backtracking solver or stored queen solution is used. Identical
            seeds and settings reproduce the same run.
          </p>
        </section>
        <Footer onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      </main>
      {modal && (
        <Modal
          title="A chess puzzle. An evolving population."
          onClose={() => setModal(false)}
        >
          <p className="modal-intro">
            Place {size} queens on a {size} × {size} board so no two share a
            row, column, or diagonal. The algorithm explores many candidate
            boards at once.
          </p>
          <ol className="guide-list">
            <li>
              <span>1</span>
              <div>
                <h3>Start with variety</h3>
                <p>
                  Each random chromosome gives one row per column. Fitness
                  rewards non-attacking pairs; {max} is perfect for this board
                  size.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Select, mix, mutate</h3>
                <p>
                  Fitter parents have a better chance to reproduce. A single cut
                  combines two parents, then random gene mutations introduce new
                  queen positions.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Look below the board</h3>
                <p>
                  The working section shows an actual offspring from the current
                  generation: both parents, the cut, and any mutations. The
                  population cards are selectable.
                </p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <h3>Play it your way</h3>
                <p>
                  Try it yourself lets you move queens freely within their
                  columns. Evolve from my board includes your arrangement in a
                  fresh random population.
                </p>
              </div>
            </li>
          </ol>
          <div className="guide-note">
            <Sparkles size={17} />
            <span>
              A run can reach the generation limit without solving the puzzle.
              That is a real outcome of evolutionary search. Change the seed or
              settings and try again.
            </span>
          </div>
          <button className="primary-button" onClick={() => setModal(false)}>
            Let’s evolve
            <ArrowRight size={15} />
          </button>
        </Modal>
      )}
    </>
  );
}

function ChessBoard({ board, pairs, showAttacks, onMove }) {
  const n = board.length,
    attacking = new Set(pairs.flat());
  return (
    <div className="chess-shell" style={{ "--n": n }}>
      <div className="board-ranks">
        {Array.from({ length: n }, (_, r) => (
          <span key={r}>{r + 1}</span>
        ))}
      </div>
      <div
        className="chess-board"
        role="grid"
        aria-label={`${n} by ${n} queen chessboard`}
      >
        {Array.from({ length: n }, (_, row) => (
          <div className="chess-row" role="row" key={row}>
            {Array.from({ length: n }, (_, col) => (
              <button
                role="gridcell"
                key={col}
                className={`chess-square ${(row + col) % 2 ? "dark-square" : "light-square"} ${board[col] === row ? "has-queen" : ""} ${board[col] === row && attacking.has(col) && showAttacks ? "attacking-queen" : ""}`}
                aria-label={`Column ${String.fromCharCode(65 + col)}, row ${row + 1}${board[col] === row ? ", queen" : ""}`}
                onClick={() => onMove(col, row)}
              >
                {board[col] === row && <QueenIcon />}
              </button>
            ))}
          </div>
        ))}
        {showAttacks && (
          <svg
            className="attack-lines"
            viewBox={`0 0 ${n * 100} ${n * 100}`}
            aria-hidden="true"
          >
            {pairs.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={a * 100 + 50}
                y1={board[a] * 100 + 50}
                x2={b * 100 + 50}
                y2={board[b] * 100 + 50}
              />
            ))}
          </svg>
        )}
      </div>
      <div className="board-files">
        {Array.from({ length: n }, (_, i) => (
          <span key={i}>{String.fromCharCode(65 + i)}</span>
        ))}
      </div>
    </div>
  );
}
function QueenIcon() {
  return (
    <svg className="queen-piece" viewBox="0 0 50 55" aria-hidden="true">
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="12" r="3.3" />
        <circle cx="16" cy="7" r="3.3" />
        <circle cx="25" cy="5" r="3.3" />
        <circle cx="34" cy="7" r="3.3" />
        <circle cx="43" cy="12" r="3.3" />
        <path d="M8 17 L14 33 H36 L42 17 L32 24 L33 12 L25 23 L17 12 L18 24 Z" />
        <path d="M15 36 H35 L33 41 H17 Z M18 43 H32 L37 49 H13 Z" />
        <rect x="11" y="50" width="28" height="3" rx="1" />
      </g>
    </svg>
  );
}
function Genes({ board, cut, changes = [] }) {
  return (
    <div className="gene-strip">
      {board.map((row, col) => (
        <span
          key={col}
          className={`${cut !== undefined && col >= cut ? "gene-parent-b" : "gene-parent-a"} ${changes.some((c) => c.col === col) ? "gene-mutated" : ""} ${cut > 0 && cut === col ? "gene-cut" : ""}`}
          title={`Column ${String.fromCharCode(65 + col)}: row ${row + 1}`}
        >
          {row + 1}
        </span>
      ))}
    </div>
  );
}
function MiniBoard({ board }) {
  const n = board.length;
  return (
    <div
      className="mini-board"
      style={{ gridTemplateColumns: `repeat(${n},1fr)` }}
      aria-hidden="true"
    >
      {Array.from({ length: n * n }, (_, i) => (
        <span
          key={i}
          className={
            (Math.floor(i / n) + (i % n)) % 2 ? "mini-dark" : "mini-light"
          }
        >
          {board[i % n] === Math.floor(i / n) && <i />}
        </span>
      ))}
    </div>
  );
}
function FitnessChart({ frames, max }) {
  const w = 240,
    h = 95;
  const points = (key) =>
    frames
      .map(
        (f, i) =>
          `${10 + (i / Math.max(1, frames.length - 1)) * (w - 20)},${h - 12 - (f[key] / max) * (h - 25)}`,
      )
      .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="fitness-chart-svg"
      role="img"
      aria-label={`Best fitness ${frames.at(-1).best.fitness} of ${max}; average ${frames.at(-1).average.toFixed(1)}`}
    >
      <path
        d={`M10 13H${w - 10} M10 ${h / 2}H${w - 10} M10 ${h - 12}H${w - 10}`}
        className="chart-grid"
      />
      <polyline points={points("average")} className="average-line" />
      <polyline
        points={frames
          .map(
            (f, i) =>
              `${10 + (i / Math.max(1, frames.length - 1)) * (w - 20)},${h - 12 - (f.best.fitness / max) * (h - 25)}`,
          )
          .join(" ")}
        className="best-line"
      />
      {frames.length === 1 && (
        <circle
          cx="10"
          cy={h - 12 - (frames[0].best.fitness / max) * (h - 25)}
          r="3"
          fill="#6d8b4b"
        />
      )}
    </svg>
  );
}
function OperatorTrace({ frame, selection, rate }) {
  const trace = frame.trace;
  if (!trace)
    return (
      <div className="initial-generation">
        <span className="concept-icon">
          <Dna size={23} />
        </span>
        <div>
          <h3>Before evolution, a little randomness.</h3>
          <p>
            Generation 0 contains the initial random population. Step forward to
            see actual parent selection, crossover, and mutation. Each later
            example shows one real offspring; all other offspring are produced
            the same way.
          </p>
        </div>
      </div>
    );
  return (
    <>
      <article className="operator-card">
        <div className="operator-heading">
          <span>01</span>
          <h3>Select two parents</h3>
          <Target size={16} />
        </div>
        <p>
          {selection === "tournament"
            ? "Best of 3 random candidates, drawn twice."
            : "Two fitness-weighted random draws (fitness + 1)."}
        </p>
        <label>
          PARENT A <span>fitness {trace.a.fitness}</span>
        </label>
        <Genes board={trace.a.board} />
        <label>
          PARENT B <span>fitness {trace.b.fitness}</span>
        </label>
        <Genes board={trace.b.board} cut={0} />
      </article>
      <article className="operator-card">
        <div className="operator-heading">
          <span>02</span>
          <h3>Mix their good ideas</h3>
          <GitMerge size={16} />
        </div>
        <p>
          Cut after gene {trace.cut}. Inherit the left side from A and the right
          side from B.
        </p>
        <label>CROSSOVER CHILD</label>
        <Genes board={trace.crossed} cut={trace.cut} />
        <div className="operator-note">
          <span className="parent-a-dot" />
          Parent A<span className="parent-b-dot" />
          Parent B
        </div>
        <small>
          Rows can repeat. Fitness will decide whether this arrangement
          survives.
        </small>
      </article>
      <article className="operator-card">
        <div className="operator-heading">
          <span>03</span>
          <h3>Make room for new</h3>
          <Sparkles size={16} />
        </div>
        <p>
          Each gene independently has a {Math.round(rate * 100)}% chance of
          moving its queen to a different row.
        </p>
        <label>
          AFTER MUTATION <span>fitness {trace.child.fitness}</span>
        </label>
        <Genes
          board={trace.child.board}
          cut={trace.cut}
          changes={trace.changes}
        />
        <div className="mutation-list">
          {trace.changes.length ? (
            trace.changes.map((c) => (
              <span key={c.col}>
                {String.fromCharCode(65 + c.col)}: {c.from + 1}
                <ArrowRight size={9} />
                {c.to + 1}
              </span>
            ))
          ) : (
            <span>
              No mutations in this child. That’s a valid random outcome.
            </span>
          )}
        </div>
        <small>
          This offspring enters the new population alongside the two preserved
          elites.
        </small>
      </article>
    </>
  );
}
