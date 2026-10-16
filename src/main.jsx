import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  GitFork,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  StepBack,
  StepForward,
  RotateCcw,
  Shuffle,
  Minus,
  Plus,
  Maximize2,
  X,
  BookOpen,
  Code2,
  Scissors,
  Check,
  Sparkles,
  CircleHelp,
  MousePointer2,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import {
  buildTree,
  runSearch,
  formatValue,
  optimalPath,
  LECTURE_VALUES,
} from "./algorithm";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./styles.css";

const cx = (...s) => s.filter(Boolean).join(" ");
const getRandomValues = (count) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * 21) - 5);
const PSEUDO = [
  "function search(node, α, β):",
  "  visit(node)",
  "  if terminal: return utility(node)",
  "  best = MAX ? −∞ : +∞",
  "  for child in children(node):",
  "    if MAX: best = max(best, search(child, α, β)); α = max(α, best)",
  "    if MIN: best = min(best, search(child, α, β)); β = min(β, best)",
  "    if β ≤ α: break  // prune remaining children",
  "  return best",
  "// Root returns the optimal game value",
];

function App() {
  const [algorithm, setAlgorithm] = useState("alphabeta");
  const [depth, setDepth] = useState(3);
  const [branching, setBranching] = useState(2);
  const [leaves, setLeaves] = useState(LECTURE_VALUES);
  const [preset, setPreset] = useState("lecture");
  const [direction, setDirection] = useState("left");
  const [rootMax, setRootMax] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState("tree");
  const [zoom, setZoom] = useState(1);
  const [modal, setModal] = useState(null);
  const [inspectId, setInspectId] = useState(null);
  const [full, setFull] = useState(false);
  const tree = useMemo(
    () => buildTree(depth, branching, leaves, rootMax),
    [depth, branching, leaves, rootMax],
  );
  const frames = useMemo(
    () => runSearch(tree, algorithm === "alphabeta", direction),
    [tree, algorithm, direction],
  );
  const frame = frames[Math.min(step, frames.length - 1)];
  const complete = step === frames.length - 1;
  const node = tree.nodes[inspectId ?? frame.active];
  const bounds = frame.bounds[node.id] ?? { alpha: -Infinity, beta: Infinity };
  const comparisons = useMemo(
    () => [
      runSearch(tree, false, direction).at(-1),
      runSearch(tree, true, direction).at(-1),
    ],
    [tree, direction],
  );
  const path = complete ? optimalPath(frame) : [];
  const prunedLeaves = tree.nodes.filter(
    (n) => n.leaf && frame.statuses[n.id] === "pruned",
  ).length;

  const reset = () => {
    setStep(0);
    setPlaying(false);
    setInspectId(null);
  };
  useEffect(() => {
    reset();
  }, [frames]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStep((prev) => {
          if (prev >= frames.length - 2) {
            setPlaying(false);
            return frames.length - 1;
          }
          return prev + 1;
        }),
      1000 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, frames.length]);
  const togglePlay = () => {
    setInspectId(null);
    if (complete) setStep(0);
    setPlaying((v) => !v);
  };
  const move = (delta) => {
    setPlaying(false);
    setInspectId(null);
    setStep((s) => Math.max(0, Math.min(frames.length - 1, s + delta)));
  };
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setFull(false);
      }
      if (
        ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(
          e.target.tagName,
        ) ||
        modal
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
      if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  function resizeTree(d, b) {
    setDepth(d);
    setBranching(b);
    setLeaves(
      Array.from(
        { length: b ** d },
        (_, i) => leaves[i] ?? Math.floor(Math.random() * 16),
      ),
    );
    setPreset("custom");
    setZoom(1);
  }
  function applyPreset(value) {
    setPreset(value);
    setDepth(3);
    setBranching(2);
    setRootMax(true);
    setDirection("left");
    setZoom(1);
    setLeaves(
      value === "lecture"
        ? LECTURE_VALUES
        : value === "pruning"
          ? [9, 8, 10, 7, 2, 1, 6, 3]
          : value === "negative"
            ? [-5, -2, -7, 3, -9, -1, 0, -4]
            : getRandomValues(8),
    );
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Branch home">
          <span className="brand-mark">
            <GitFork size={23} />
          </span>
          branch<span className="brand-dot">.</span>
        </a>
        <div className="header-divider" />
        <span className="brand-descriptor">
          A little clarity for complex decisions.
        </span>
        <nav>
          <a className="nav-active" href="#playground">
            Playground
          </a>
          <a href="#learn">The concepts</a>
          <button className="nav-guide" onClick={() => setModal("guide")}>
            <BookOpen size={15} /> Quick guide <ArrowUpRight size={14} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero" id="playground">
          <div>
            <div className="eyebrow">
              <span /> THE ALGORITHM PLAYGROUND
            </div>
            <h1>
              Minimax, <span>made visible.</span>
            </h1>
            <p>
              Follow the decisions. Find the best move. See what you can skip.
            </p>
          </div>
          <button className="how-button" onClick={() => setModal("guide")}>
            <span className="small-play">
              <Play size={13} fill="currentColor" />
            </span>{" "}
            How does it work? <ArrowUpRight size={15} />
          </button>
        </section>
        <div className="workspace-heading">
          <div>
            <span className="live-dot" /> INTERACTIVE WORKSPACE{" "}
            <span className="workspace-line" />
          </div>
          <span>Experiment. Observe. Understand.</span>
        </div>
        <section
          className={cx("workspace", full && "workspace-full")}
          aria-label="Algorithm playground"
        >
          <aside className="settings">
            <div className="panel-heading">
              <SlidersHorizontal size={16} />
              <h2>Your experiment</h2>
              <button
                title="Reset to lecture example"
                aria-label="Reset to lecture example"
                onClick={() => applyPreset("lecture")}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div className="setting-group">
              <label className="field-label">
                Algorithm{" "}
                <button
                  onClick={() => setModal("guide")}
                  aria-label="Learn about the algorithms"
                >
                  <CircleHelp size={13} />
                </button>
              </label>
              <div className="algorithm-switch">
                <button
                  className={cx(algorithm === "minimax" && "selected")}
                  onClick={() => setAlgorithm("minimax")}
                >
                  Minimax
                </button>
                <button
                  className={cx(algorithm === "alphabeta" && "selected")}
                  onClick={() => setAlgorithm("alphabeta")}
                >
                  Alpha–beta
                </button>
              </div>
              <p className="field-hint">
                {algorithm === "alphabeta"
                  ? "Same best move. A smarter search."
                  : "Explore every outcome. Find the best move."}
              </p>
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="preset">
                Start with a tree
              </label>
              <div className="select-wrap">
                <select
                  id="preset"
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  <option value="lecture">The lecture example</option>
                  <option value="pruning">Pruning showcase</option>
                  <option value="negative">Negative utilities</option>
                  <option value="custom" disabled>
                    Custom tree
                  </option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="setting-row">
              <div>
                <label className="field-label" htmlFor="depth">
                  Tree depth
                </label>
                <div className="select-wrap">
                  <select
                    id="depth"
                    value={depth}
                    onChange={(e) =>
                      resizeTree(Number(e.target.value), branching)
                    }
                  >
                    {[2, 3, 4].map((v) => (
                      <option key={v} value={v}>
                        {v} ply
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="branching">
                  Branches
                </label>
                <div className="select-wrap">
                  <select
                    id="branching"
                    value={branching}
                    onChange={(e) => resizeTree(depth, Number(e.target.value))}
                  >
                    {[2, 3].map((v) => (
                      <option key={v} value={v}>
                        {v} per node
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
            </div>
            <div className="setting-group traversal">
              <label className="field-label" htmlFor="direction">
                Traversal order
              </label>
              <div className="select-wrap">
                <select
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                >
                  <option value="left">Left to right →</option>
                  <option value="right">Right to left ←</option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="leaf-section">
              <div className="field-label">
                Leaf values <span>{leaves.length} outcomes</span>
              </div>
              <p className="field-hint">Make it yours. Edit any value below.</p>
              <div className="leaf-inputs">
                {leaves.map((v, i) => (
                  <input
                    key={i}
                    aria-label={`Leaf ${i + 1} value`}
                    type="number"
                    min="-999"
                    max="999"
                    value={v}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && Math.abs(v) <= 999) {
                        setLeaves((old) =>
                          old.map((n, j) => (j === i ? v : n)),
                        );
                        setPreset("custom");
                      }
                    }}
                  />
                ))}
              </div>
              <button
                className="randomize"
                onClick={() => {
                  setLeaves(getRandomValues(leaves.length));
                  setPreset("custom");
                }}
              >
                <Shuffle size={14} /> Randomize values
              </button>
            </div>
            <div className="root-setting">
              <span>Root player</span>
              <div>
                <button
                  className={cx(rootMax && "chosen")}
                  onClick={() => setRootMax(true)}
                >
                  MAX
                </button>
                <button
                  className={cx(!rootMax && "chosen")}
                  onClick={() => setRootMax(false)}
                >
                  MIN
                </button>
              </div>
            </div>
            <div className="settings-note">
              <Sparkles size={16} />
              <p>
                Small changes, different decisions.
                <br />
                Try a new value and run it again.
              </p>
            </div>
          </aside>
          <div className="visual-area">
            <div className="canvas-toolbar">
              <div role="tablist" aria-label="Visualization view">
                <button
                  role="tab"
                  aria-selected={tab === "tree"}
                  className={cx(tab === "tree" && "active")}
                  onClick={() => setTab("tree")}
                >
                  <GitFork size={15} /> Tree visualization
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "compare"}
                  className={cx(tab === "compare" && "active")}
                  onClick={() => setTab("compare")}
                >
                  <Layers size={15} /> Compare
                </button>
              </div>
              <span className="tree-size">
                {tree.nodes.length} nodes <span>·</span> {leaves.length} leaves
              </span>
            </div>
            {tab === "tree" ? (
              <div className="tree-canvas">
                <div className="canvas-topline">
                  <span className="canvas-label">
                    {algorithm === "alphabeta"
                      ? "ALPHA–BETA PRUNING"
                      : "MINIMAX SEARCH"}
                  </span>
                  <span
                    className={cx(
                      "status-pill",
                      playing && "is-running",
                      complete && "is-complete",
                    )}
                  >
                    <span />
                    {playing
                      ? "Running"
                      : complete
                        ? "Complete"
                        : step === 0
                          ? "Ready to explore"
                          : "Paused"}
                  </span>
                </div>
                <div className="tree-scroll">
                  <Tree
                    pruning={algorithm === "alphabeta"}
                    tree={tree}
                    frame={frame}
                    path={path}
                    zoom={zoom}
                    inspectId={inspectId}
                    onSelect={(id) => {
                      setInspectId(id);
                      setPlaying(false);
                    }}
                  />
                </div>
                <div className="canvas-bottom">
                  <div className="tree-legend">
                    <span>
                      <i className="legend-current" />
                      Current
                    </span>
                    <span>
                      <i className="legend-visited" />
                      Evaluated
                    </span>
                    <span>
                      <i className="legend-pruned" />
                      Pruned
                    </span>
                    <span>
                      <i className="legend-path" />
                      Best path
                    </span>
                  </div>
                  <div className="zoom-controls">
                    <button
                      aria-label="Zoom out"
                      disabled={zoom <= 0.5}
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      className="zoom-value"
                      title="Reset zoom"
                      onClick={() => setZoom(1)}
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      aria-label="Zoom in"
                      disabled={zoom >= 2}
                      onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                    >
                      <Plus size={14} />
                    </button>
                    <span />
                    <button
                      aria-label={
                        full ? "Exit expanded view" : "Expand workspace"
                      }
                      onClick={() => setFull((v) => !v)}
                    >
                      {full ? <X size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Compare
                comparisons={comparisons}
                tree={tree}
                onRun={() => {
                  setTab("tree");
                  reset();
                  setPlaying(true);
                }}
              />
            )}
            <div className="playback">
              <div className="timeline-row">
                <span>
                  Step <strong>{step}</strong>{" "}
                  <span>/ {frames.length - 1}</span>
                </span>
                <input
                  aria-label="Timeline step"
                  type="range"
                  min="0"
                  max={frames.length - 1}
                  value={step}
                  style={{
                    "--progress": `${(step / (frames.length - 1)) * 100}%`,
                  }}
                  onChange={(e) => {
                    setPlaying(false);
                    setInspectId(null);
                    setStep(Number(e.target.value));
                  }}
                />
                <span className="timeline-end">
                  {Math.round((step / (frames.length - 1)) * 100)}%
                </span>
              </div>
              <div className="playback-buttons">
                <div className="playback-main">
                  <button
                    aria-label="Reset search"
                    title="Reset (R)"
                    onClick={reset}
                    disabled={step === 0 && !playing}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    aria-label="Previous step"
                    title="Previous step (←)"
                    disabled={step === 0}
                    onClick={() => move(-1)}
                  >
                    <StepBack size={19} />
                  </button>
                  <button className="play-button" onClick={togglePlay}>
                    {playing ? (
                      <Pause size={15} fill="currentColor" />
                    ) : (
                      <Play size={15} fill="currentColor" />
                    )}
                    {playing ? "Pause" : complete ? "Replay" : "Play"}
                    <span>space</span>
                  </button>
                  <button
                    aria-label="Next step"
                    title="Next step (→)"
                    disabled={complete}
                    onClick={() => move(1)}
                  >
                    <StepForward size={19} />
                  </button>
                  <button
                    aria-label="Jump to result"
                    title="Jump to result"
                    disabled={complete}
                    onClick={() => {
                      setStep(frames.length - 1);
                      setPlaying(false);
                      setInspectId(null);
                    }}
                  >
                    <SkipForward size={16} />
                  </button>
                </div>
                <label className="speed-control">
                  Speed{" "}
                  <select
                    aria-label="Playback speed"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value="0.5">0.5×</option>
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          <aside className="inspector">
            <div className="panel-heading">
              <span className="live-dot" />
              <h2>Behind the decision</h2>
            </div>
            <div className="step-story">
              <div className="step-kicker">
                {complete
                  ? "THE RESULT"
                  : `STEP ${String(step).padStart(2, "0")}`}
                <span>
                  {frame.type === "prune" ? (
                    <Scissors size={14} />
                  ) : complete ? (
                    <Check size={14} />
                  ) : (
                    <ArrowUpRight size={15} />
                  )}
                </span>
              </div>
              <h3>{frame.title}</h3>
              <p aria-live="polite">{frame.description}</p>
            </div>
            <div className="node-inspector">
              <div className="inspector-label">
                {inspectId !== null ? "SELECTED NODE" : "CURRENT NODE"}
                {inspectId !== null && (
                  <button
                    title="Follow current node"
                    aria-label="Follow current node"
                    onClick={() => setInspectId(null)}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="current-node">
                <span className={cx("node-badge", !node.isMax && "min-badge")}>
                  {node.label}
                </span>
                <div>
                  <strong>
                    {node.leaf
                      ? "Terminal node"
                      : `${node.isMax ? "MAX" : "MIN"} player`}
                  </strong>
                  <span>
                    {node.leaf
                      ? "Returns its utility"
                      : node.isMax
                        ? "Chooses the highest value"
                        : "Chooses the lowest value"}
                  </span>
                </div>
                <span className="current-value">
                  {frame.valueTypes[node.id] === "lower"
                    ? "≥"
                    : frame.valueTypes[node.id] === "upper"
                      ? "≤"
                      : ""}
                  {formatValue(frame.values[node.id])}
                </span>
              </div>
              <div
                className={cx(
                  "bounds-grid",
                  algorithm === "minimax" && "bounds-inactive",
                )}
              >
                <div>
                  <label>
                    α <span>Alpha</span>
                  </label>
                  <strong>
                    {algorithm === "minimax" ? "—" : formatValue(bounds.alpha)}
                  </strong>
                  <small>MAX’s best guarantee</small>
                </div>
                <div>
                  <label>
                    β <span>Beta</span>
                  </label>
                  <strong>
                    {algorithm === "minimax" ? "—" : formatValue(bounds.beta)}
                  </strong>
                  <small>MIN’s best guarantee</small>
                </div>
              </div>
            </div>
            <div className="search-progress">
              <div className="inspector-label">SEARCH PROGRESS</div>
              <div className="metric-row">
                <span>Leaves evaluated</span>
                <strong>
                  {frame.visitedLeaves}
                  <span> / {leaves.length}</span>
                </strong>
              </div>
              <div className="progress-bar">
                <span
                  style={{
                    width: `${(frame.visitedLeaves / leaves.length) * 100}%`,
                  }}
                />
                <i
                  style={{ width: `${(prunedLeaves / leaves.length) * 100}%` }}
                />
              </div>
              <div className="metric-row">
                <span>Nodes pruned</span>
                <strong className="pruned-number">
                  {frame.pruned.length}
                  <Scissors size={12} />
                </strong>
              </div>
              <div className="metric-row">
                <span>Optimal value</span>
                <strong className={cx(complete && "result-value")}>
                  {complete ? frame.result : "—"}
                </strong>
              </div>
            </div>
            <button className="code-button" onClick={() => setModal("code")}>
              <Code2 size={16} />
              <span>Follow the pseudocode</span>
              <ArrowUpRight size={14} />
            </button>
            <p className="inspector-tip">
              <MousePointer2 size={12} /> Click any node to inspect it.
            </p>
          </aside>
        </section>
        <div className="under-workspace">
          <span>
            <span className="keyboard-key">←</span>
            <span className="keyboard-key">→</span> to step through <i />{" "}
            <span className="keyboard-key">space</span> to play / pause
          </span>
          <span>
            Built for the “oh, now I get it” moment.
            <Sparkles size={13} />
          </span>
        </div>
        <section id="learn" className="learn-section">
          <div className="learn-intro">
            <div className="eyebrow">A LITTLE THEORY, A LOT OF CLARITY</div>
            <h2>Two players. One best decision.</h2>
            <p>A game of competing goals, explored one branch at a time.</p>
          </div>
          <div className="concept-cards">
            <article>
              <span className="concept-icon max-icon">
                <ArrowUpRight size={21} />
              </span>
              <span className="concept-number">01 / THE GOAL</span>
              <h3>MAX reaches higher.</h3>
              <p>
                MAX picks the largest child value. MIN picks the smallest. Each
                assumes the other will play their best.
              </p>
              <div className="concept-example">
                MAX (2, 3) <ArrowRight size={13} />
                <strong>3</strong>
                <span>
                  MIN (3, 9) <ArrowRight size={13} />
                  <strong>3</strong>
                </span>
              </div>
            </article>
            <article>
              <span className="concept-icon">
                <GitFork size={20} />
              </span>
              <span className="concept-number">02 / THE SEARCH</span>
              <h3>Values travel upward.</h3>
              <p>
                Explore down to the leaves, then pass their scores back up. At
                the root, minimax reveals the best guaranteed outcome.
              </p>
              <div className="concept-footnote">
                Worst-case time{" "}
                <code>
                  O(b<sup>d</sup>)
                </code>
                <span>Every leaf has a say.</span>
              </div>
            </article>
            <article>
              <span className="concept-icon prune-icon">
                <Scissors size={20} />
              </span>
              <span className="concept-number">03 / THE SHORTCUT</span>
              <h3>Some branches can wait. Forever.</h3>
              <p>
                When β ≤ α, a branch can’t improve the decision. Alpha–beta
                skips it and gets the same minimax result.
              </p>
              <div className="concept-footnote">
                Best-case time{" "}
                <code>
                  O(b<sup>d/2</sup>)
                </code>
                <span>With ideal move ordering.</span>
              </div>
            </article>
          </div>
        </section>
        <footer>
          <a className="brand footer-brand" href="#">
            <GitFork size={18} /> branch.
          </a>
          <span>Less memorizing. More understanding.</span>
          <a href="#playground">
            Back to the playground <ArrowUpRight size={13} />
          </a>
        </footer>
      </main>
      {modal && (
        <Modal
          title={
            modal === "code"
              ? "The logic behind the branches."
              : "Meet your two decision-makers."
          }
          onClose={() => setModal(null)}
        >
          {modal === "code" ? (
            <>
              <p className="modal-intro">
                {algorithm === "alphabeta" ? "Alpha–beta pruning" : "Minimax"} ·
                Step {step} of {frames.length - 1}. The highlighted line is the
                current operation.
              </p>
              <div className="pseudocode">
                {PSEUDO.map((line, i) => (
                  <div
                    key={i}
                    className={cx(
                      frame.line === i && "code-active",
                      algorithm === "minimax" && i === 7 && "unused-line",
                    )}
                  >
                    <span>{i + 1}</span>
                    <code>
                      {algorithm === "minimax"
                        ? line
                            .replace("; α = max(α, best)", "")
                            .replace("; β = min(β, best)", "")
                        : line}
                    </code>
                  </div>
                ))}
              </div>
              <p className="code-explanation">{frame.description}</p>
              <div className="modal-playback">
                <button onClick={() => move(-1)} disabled={step === 0}>
                  <StepBack size={16} /> Previous
                </button>
                <button onClick={() => move(1)} disabled={complete}>
                  Next step <StepForward size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="modal-intro">
                Minimax finds the best move when your opponent is trying just as
                hard as you are.
              </p>
              <ol className="guide-list">
                <li>
                  <span>1</span>
                  <div>
                    <h3>Start at the bottom</h3>
                    <p>
                      The leaf numbers are scores for MAX. Higher is better for
                      MAX; lower is better for MIN.
                    </p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <h3>Take turns choosing</h3>
                    <p>
                      At each MAX node, keep the largest child score. At each
                      MIN node, keep the smallest. Work back up to the root.
                    </p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <h3>Skip what can’t change the answer</h3>
                    <p>
                      Alpha (α) is MAX’s lower guarantee; beta (β) is MIN’s
                      upper guarantee. When β ≤ α, the remaining branch cannot
                      improve an ancestor’s decision.
                    </p>
                  </div>
                </li>
                <li>
                  <span>4</span>
                  <div>
                    <h3>Make it click</h3>
                    <p>
                      Press play, or use the arrow keys to follow each visit,
                      value update, and cutoff. Edit a leaf to see the decision
                      change.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="guide-note">
                <Scissors size={18} />
                <span>
                  Pruning changes how much we search. The optimal value stays
                  the same. Move order determines how much work we save.
                </span>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setModal(null);
                  document
                    .getElementById("playground")
                    .scrollIntoView({ behavior: "smooth" });
                }}
              >
                Let’s explore <ArrowRight size={16} />
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function Tree({ tree, frame, path, zoom, inspectId, onSelect, pruning }) {
  const width = Math.max(730, tree.leafCount * 43);
  const height = 370;
  const top = 42;
  const bottom = 310;
  const pos = (node) => ({
    x: 68 + node.x * (width - 105),
    y: top + (node.level / tree.depth) * (bottom - top),
  });
  return (
    <svg
      className="tree-svg"
      role="group"
      aria-label="Interactive game tree"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: `${zoom * 100}%`,
        minWidth: (width > 850 ? width : 500) * zoom,
      }}
    >
      <defs>
        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {Array.from({ length: tree.depth + 1 }, (_, i) => (
        <g
          key={i}
          className="level-label"
          transform={`translate(8,${top + (i / tree.depth) * (bottom - top)})`}
        >
          <text y="-3">
            {i === tree.depth
              ? "LEAF"
              : (i % 2 === 0) === tree.rootMax
                ? "MAX"
                : "MIN"}
          </text>
          <text y="12" className="level-number">
            {i === tree.depth ? "utility" : `level ${i}`}
          </text>
        </g>
      ))}
      {tree.nodes
        .filter((n) => n.parent !== null)
        .map((n) => {
          const parent = tree.nodes[n.parent],
            from = pos(parent),
            to = pos(n);
          const pruned = frame.statuses[n.id] === "pruned";
          const active = frame.stack.includes(n.id) || frame.from === n.id;
          const best = path.includes(n.id) && path.includes(parent.id);
          return (
            <g key={`edge-${n.id}`}>
              <path
                className={cx(
                  "tree-edge",
                  frame.statuses[n.id] && "edge-visited",
                  active && "edge-active",
                  pruned && "edge-pruned",
                  best && "edge-best",
                )}
                d={`M ${from.x} ${from.y + 19} L ${to.x} ${to.y - 19}`}
              />
              {pruned && frame.statuses[parent.id] !== "pruned" && (
                <g
                  className="prune-cross"
                  transform={`translate(${(from.x + to.x) / 2},${(from.y + to.y) / 2})`}
                >
                  <circle r="9" />
                  <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" />
                </g>
              )}
            </g>
          );
        })}
      {tree.nodes.map((n) => {
        const p = pos(n),
          current = frame.active === n.id,
          visited = frame.statuses[n.id] === "done",
          pruned = frame.statuses[n.id] === "pruned",
          best = path.includes(n.id);
        const value = n.leaf ? n.value : frame.values[n.id];
        return (
          <g
            key={n.id}
            transform={`translate(${p.x},${p.y})`}
            className={cx(
              "tree-node",
              n.isMax ? "max-node" : "min-node",
              n.leaf && "leaf-node",
              visited && "node-visited",
              current && "node-current",
              pruned && "node-pruned",
              best && "node-best",
              inspectId === n.id && "node-selected",
            )}
            role="button"
            tabIndex="0"
            aria-label={`Node ${n.label}, ${n.leaf ? `leaf value ${n.value}` : `${n.isMax ? "MAX" : "MIN"}, value ${formatValue(value)}`}${pruned ? ", pruned" : ""}`}
            onClick={() => onSelect(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onSelect(n.id);
              }
            }}
          >
            <title>
              {n.label}:{" "}
              {n.leaf
                ? `Utility ${n.value}`
                : `${n.isMax ? "MAX" : "MIN"} player`}{" "}
              {pruned ? "(pruned)" : ""}
            </title>
            {current && <circle className="current-halo" r="29" />}
            {current && !n.leaf && pruning && (
              <g className="node-bound-label" transform="translate(0,-31)">
                <rect x="-47" y="-10" width="94" height="16" rx="5" />
                <text textAnchor="middle" y="1">
                  α {formatValue(frame.bounds[n.id]?.alpha ?? -Infinity)} · β{" "}
                  {formatValue(frame.bounds[n.id]?.beta ?? Infinity)}
                </text>
              </g>
            )}
            {n.leaf ? (
              <rect
                className="node-shape"
                x="-17"
                y="-17"
                width="34"
                height="34"
                rx="7"
              />
            ) : (
              <circle className="node-shape" r="21" />
            )}
            <text className="node-text" textAnchor="middle" dy="5">
              {n.leaf ? value : n.label}
            </text>
            {!n.leaf && (
              <text textAnchor="middle" y="38" className="node-value">
                {frame.valueTypes[n.id] === "lower"
                  ? "≥ "
                  : frame.valueTypes[n.id] === "upper"
                    ? "≤ "
                    : ""}
                {value === undefined ? "?" : value}
              </text>
            )}
            {n.leaf && (
              <text textAnchor="middle" y="35" className="leaf-label">
                {n.label}
              </text>
            )}
            {best && !n.leaf && (
              <g transform="translate(16,-17)">
                <circle r="7" className="best-check" />
                <path d="M -3 0 L -1 2 L 3 -2" className="best-check-path" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Compare({ comparisons, tree, onRun }) {
  const [mini, ab] = comparisons;
  const saving = Math.round((1 - ab.visitedNodes / mini.visitedNodes) * 100);
  return (
    <div className="compare-view">
      <div className="compare-eyebrow">
        <Scissors size={15} /> A SMARTER WAY THROUGH THE TREE
      </div>
      <h3>Same answer. Less searching.</h3>
      <p>
        Both algorithms return <strong>{ab.result}</strong> for your current
        tree.
        <br />
        Here’s the work it takes to get there.
      </p>
      <div className="comparison-chart">
        {[
          { name: "Minimax", data: mini },
          { name: "Alpha–beta", data: ab },
        ].map(({ name, data }) => (
          <div key={name}>
            <div className="compare-bar-title">
              <span>{name}</span>
              <strong>
                {data.visitedNodes}
                <small> / {tree.nodes.length} nodes visited</small>
              </strong>
            </div>
            <div className="compare-track">
              <span
                style={{
                  width: `${(data.visitedNodes / tree.nodes.length) * 100}%`,
                }}
              />
            </div>
            <div className="compare-small">
              {data.visitedLeaves} leaves evaluated · {data.pruned.length} nodes
              pruned
            </div>
          </div>
        ))}
      </div>
      <div className="saving-callout">
        <span>{saving}%</span>
        <div>
          <strong>less work with alpha–beta</strong>
          <p>
            {saving === 0
              ? "Try changing leaf values or traversal order to reveal a cutoff."
              : "Branches skipped. The best decision preserved."}
          </p>
        </div>
      </div>
      <button onClick={onRun}>
        Watch the search unfold <ArrowRight size={14} />
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const buttons = dialog.current.querySelectorAll(
        'button:not(:disabled), a, input, select, [tabindex="0"]',
      );
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <span className="eyebrow">BRANCH / FIELD NOTES</span>
          <button aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
