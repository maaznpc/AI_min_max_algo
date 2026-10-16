import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  GitFork,
  Layers,
  MousePointer2,
  Minus,
  Plus,
  Play,
  RotateCcw,
  Route,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  Header,
  Footer,
  Playback,
  Modal,
  WorkspaceHeading,
  usePlayback,
} from "./shared";
import {
  SEARCH_ALGORITHMS,
  GRAPH_PRESETS,
  makeGraph,
  runGraphSearch,
  automaticHeuristic,
  checkHeuristic,
  edgeKey,
  neighbors,
} from "./search";

const fmt = (v) => (v === undefined ? "—" : Number.isFinite(v) ? v : "∞");
const pseudo = {
  bfs: [
    "enqueue(start); mark discovered",
    "node = dequeue()  // oldest first",
    "if node is goal: return path",
    "enqueue undiscovered neighbors",
    "record their parent and depth",
    "skip already discovered states",
    "empty queue: no route",
  ],
  dfs: [
    "push(start); mark discovered",
    "node = pop()  // newest first",
    "if node is goal: return path",
    "push undiscovered neighbors in reverse order",
    "record their parent and depth",
    "skip already discovered states",
    "empty stack: no route",
  ],
  ucs: [
    "frontier = priority queue by g(n)",
    "node = remove lowest g(n)",
    "if node is goal: return path",
    "add unseen neighbors with new path costs",
    "relax any cheaper route; update parent",
    "skip routes that are not cheaper",
    "empty frontier: no route",
  ],
  astar: [
    "frontier = priority queue by g(n) + h(n)",
    "node = remove lowest f(n)",
    "if node is goal: return path",
    "add unseen neighbors with g + h",
    "reopen / update any cheaper route",
    "skip routes that are not cheaper",
    "empty frontier: no route",
  ],
  greedy: [
    "frontier = priority queue by h(n)",
    "node = remove lowest h(n)",
    "if node is goal: return path",
    "add unseen neighbors; priority = h(n)",
    "record the first route to each state",
    "skip already discovered states",
    "empty frontier: no route",
  ],
};
export default function SearchPage() {
  const [algorithm, setAlgorithm] = useState("bfs"),
    [preset, setPreset] = useState("garden"),
    [graph, setGraph] = useState(() => makeGraph()),
    [start, setStart] = useState("S"),
    [goal, setGoal] = useState("G");
  const [heuristicMode, setHeuristicMode] = useState("auto"),
    [customH, setCustomH] = useState({}),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState("graph"),
    [modal, setModal] = useState(null),
    [zoom, setZoom] = useState(1);
  const h = useMemo(
    () =>
      heuristicMode === "zero"
        ? Object.fromEntries(graph.nodes.map((n) => [n.id, 0]))
        : heuristicMode === "custom"
          ? Object.fromEntries(
              graph.nodes.map((n) => [
                n.id,
                n.id === goal ? 0 : (customH[n.id] ?? 0),
              ]),
            )
          : automaticHeuristic(graph, goal),
    [graph, goal, heuristicMode, customH],
  );
  const frames = useMemo(
    () => runGraphSearch(graph, algorithm, start, goal, h),
    [graph, algorithm, start, goal, h],
  );
  const p = usePlayback(frames),
    f = p.frame,
    info = SEARCH_ALGORITHMS[algorithm],
    informed = ["astar", "greedy"].includes(algorithm),
    checks = checkHeuristic(graph, goal, h);
  const selectedNode =
    graph.nodes.find((n) => n.id === (selected ?? f.active ?? start)) ??
    graph.nodes[0];
  const nodeId = selectedNode.id,
    g = f.costs[nodeId],
    score = g === undefined ? undefined : g + h[nodeId];
  const comparisons = useMemo(
    () =>
      Object.entries(SEARCH_ALGORITHMS).map(([id, meta]) => ({
        id,
        meta,
        result: runGraphSearch(graph, id, start, goal, h).at(-1),
      })),
    [graph, start, goal, h],
  );
  function loadPreset(value) {
    setPreset(value);
    setGraph(makeGraph(value));
    setStart("S");
    setGoal("G");
    setSelected(null);
    setCustomH({});
  }
  function changeAlgorithm(value) {
    setAlgorithm(value);
    setSelected(null);
  }
  function scrollTheory() {
    document
      .getElementById("search-theory")
      .scrollIntoView({ behavior: "smooth" });
  }
  return (
    <>
      <Header
        active="search"
        onGuide={() => setModal("guide")}
        onConcepts={scrollTheory}
      />
      <main className="new-page search-page">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span />
              THE SEARCH PLAYGROUND
            </div>
            <h1>
              Many paths. <span>Find your way.</span>
            </h1>
            <p>
              Five search strategies. One graph. A different way to see the next
              move.
            </p>
          </div>
          <button className="how-button" onClick={() => setModal("guide")}>
            <span className="small-play">
              <Play size={13} fill="currentColor" />
            </span>
            How does it work?
            <ArrowUpRight size={15} />
          </button>
        </section>
        <WorkspaceHeading right="A route is good. Understanding it is better." />
        <section
          className="workspace search-workspace"
          aria-label="Graph search playground"
        >
          <aside className="settings">
            <div className="panel-heading">
              <SlidersHorizontal size={16} />
              <h2>Your experiment</h2>
              <button
                aria-label="Reset graph example"
                onClick={() => loadPreset("garden")}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <label className="field-label">Search strategy</label>
            <div className="algorithm-list">
              {Object.entries(SEARCH_ALGORITHMS).map(([id, a], i) => (
                <React.Fragment key={id}>
                  {i === 3 && (
                    <div className="algorithm-group-label">
                      WITH A LITTLE DIRECTION
                    </div>
                  )}
                  <button
                    className={algorithm === id ? "is-selected" : ""}
                    onClick={() => changeAlgorithm(id)}
                  >
                    <span className="algorithm-abbr">{a.short}</span>
                    <span>{a.name.replace(" search", "")}</span>
                    {algorithm === id ? (
                      <Check size={12} />
                    ) : (
                      <ArrowUpRight size={12} />
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="setting-group">
              <label className="field-label" htmlFor="graph-preset">
                Start with a graph
              </label>
              <div className="select-wrap">
                <select
                  id="graph-preset"
                  value={preset}
                  onChange={(e) => loadPreset(e.target.value)}
                >
                  {Object.entries(GRAPH_PRESETS).map(([id, a]) => (
                    <option key={id} value={id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="setting-row">
              <div>
                <label className="field-label" htmlFor="start-node">
                  Start node
                </label>
                <div className="select-wrap">
                  <select
                    id="start-node"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      setSelected(null);
                    }}
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id}>{n.id}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="goal-node">
                  Goal node
                </label>
                <div className="select-wrap">
                  <select
                    id="goal-node"
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      setSelected(null);
                    }}
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id}>{n.id}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
              </div>
            </div>
            {informed && (
              <div className="setting-group heuristic-setting">
                <label className="field-label" htmlFor="heuristic">
                  Heuristic h(n)
                </label>
                <div className="select-wrap">
                  <select
                    id="heuristic"
                    value={heuristicMode}
                    onChange={(e) => {
                      if (e.target.value === "custom") setCustomH(h);
                      setHeuristicMode(e.target.value);
                    }}
                  >
                    <option value="auto">Admissible estimate</option>
                    <option value="zero">Zero estimate (h = 0)</option>
                    <option value="custom">Custom estimates</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
                {heuristicMode === "custom" && (
                  <div className="h-inputs">
                    {graph.nodes.map((n) => (
                      <label key={n.id}>
                        {n.id}
                        <input
                          type="number"
                          min="0"
                          max="99"
                          aria-label={`Heuristic for ${n.id}`}
                          disabled={n.id === goal}
                          value={h[n.id]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (
                              Number.isFinite(value) &&
                              value >= 0 &&
                              value <= 99
                            )
                              setCustomH({ ...customH, [n.id]: value });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <p
                  className={`heuristic-note ${!checks.admissible ? "caution" : ""}`}
                >
                  {checks.admissible
                    ? "✓ Lower-bound estimates"
                    : "Custom estimates can overestimate: A* may lose optimality."}
                </p>
              </div>
            )}
            <div className="edge-editor">
              <div className="field-label">
                Edge weights<span>{graph.edges.length} connections</span>
              </div>
              <p className="field-hint">Edit a cost. Rethink the route.</p>
              <div className="edge-inputs">
                {graph.edges.map((edge) => (
                  <label key={edge.id}>
                    <span>
                      {edge.a}–{edge.b}
                    </span>
                    <input
                      type="number"
                      aria-label={`Weight ${edge.id}`}
                      value={edge.weight}
                      min="1"
                      max="99"
                      onChange={(e) => {
                        const weight = Number(e.target.value);
                        if (
                          Number.isInteger(weight) &&
                          weight >= 1 &&
                          weight <= 99
                        )
                          setGraph({
                            ...graph,
                            edges: graph.edges.map((v) =>
                              v.id === edge.id ? { ...v, weight } : v,
                            ),
                          });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="edge-actions">
                <button
                  onClick={() =>
                    setGraph({
                      ...graph,
                      edges: graph.edges.map((e) => ({ ...e, weight: 1 })),
                    })
                  }
                >
                  All costs = 1
                </button>
                <button
                  aria-label="Randomize edge weights"
                  onClick={() =>
                    setGraph({
                      ...graph,
                      edges: graph.edges.map((e) => ({
                        ...e,
                        weight: 1 + Math.floor(Math.random() * 9),
                      })),
                    })
                  }
                >
                  <Shuffle size={13} />
                </button>
              </div>
            </div>
            <div className="settings-note">
              <Sparkles size={16} />
              <p>
                Same graph. Different priorities.
                <br />
                Change a strategy and compare.
              </p>
            </div>
          </aside>
          <div className="visual-area">
            <div className="canvas-toolbar">
              <div role="tablist" aria-label="Search view">
                <button
                  role="tab"
                  aria-selected={tab === "graph"}
                  className={tab === "graph" ? "active" : ""}
                  onClick={() => setTab("graph")}
                >
                  <GitFork size={15} />
                  Graph visualization
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "compare"}
                  className={tab === "compare" ? "active" : ""}
                  onClick={() => setTab("compare")}
                >
                  <Layers size={15} />
                  Compare all five
                </button>
              </div>
              <span className="tree-size">
                {graph.nodes.length} nodes · weighted
              </span>
            </div>
            {tab === "graph" ? (
              <div className="graph-canvas">
                <div className="canvas-topline">
                  <span className="canvas-label">
                    {info.name.toUpperCase()}
                  </span>
                  <span
                    className={`status-pill ${p.playing ? "is-running" : p.step === p.last ? "is-complete" : ""}`}
                  >
                    <span />
                    {p.playing
                      ? "Searching"
                      : f.type === "goal"
                        ? "Route found"
                        : f.type === "failed"
                          ? "No route"
                          : p.step === 0
                            ? "Ready to explore"
                            : "Paused"}
                  </span>
                </div>
                <div className="graph-scroll">
                  <svg
                    viewBox="0 0 820 420"
                    className="search-svg"
                    style={{ width: `${zoom * 100}%` }}
                    role="group"
                    aria-label="Interactive search graph"
                  >
                    <defs>
                      <filter id="search-glow">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>
                    </defs>
                    {graph.edges.map((e) => {
                      const a = graph.nodes.find((n) => n.id === e.a),
                        b = graph.nodes.find((n) => n.id === e.b),
                        path = f.path.some(
                          (id, i) => i && edgeKey(f.path[i - 1], id) === e.id,
                        ),
                        active = f.activeEdge === e.id,
                        treeEdge = Object.entries(f.parents).some(
                          ([id, parent]) => edgeKey(id, parent) === e.id,
                        );
                      return (
                        <g
                          key={e.id}
                          className={`graph-edge ${treeEdge ? "discovered-edge" : ""} ${active ? "active-edge" : ""} ${path ? "solution-edge" : ""}`}
                        >
                          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                          <g
                            transform={`translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2})`}
                          >
                            <rect
                              x="-12"
                              y="-11"
                              width="24"
                              height="22"
                              rx="7"
                            />
                            <text textAnchor="middle" dy="4">
                              {e.weight}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    {graph.nodes.map((n) => {
                      const current = f.active === n.id,
                        expanded = f.closed.includes(n.id),
                        frontier = f.frontier.some((a) => a.id === n.id),
                        path = f.path.includes(n.id);
                      return (
                        <g
                          key={n.id}
                          className={`graph-node ${expanded ? "expanded-node" : ""} ${frontier ? "frontier-node" : ""} ${current ? "active-node" : ""} ${path ? "solution-node" : ""} ${selected === n.id ? "selected-node" : ""}`}
                          transform={`translate(${n.x},${n.y})`}
                          role="button"
                          tabIndex="0"
                          aria-label={`Graph node ${n.id}${n.id === start ? ", start" : ""}${n.id === goal ? ", goal" : ""}`}
                          onClick={() => {
                            setSelected(n.id);
                            p.setPlaying(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelected(n.id);
                              p.setPlaying(false);
                            }
                          }}
                        >
                          {current && <circle className="graph-halo" r="35" />}
                          <circle className="graph-node-shape" r="25" />
                          <text
                            className="graph-node-letter"
                            textAnchor="middle"
                            dy="6"
                          >
                            {n.id}
                          </text>
                          {(n.id === start || n.id === goal) && (
                            <g
                              className="endpoint-tag"
                              transform="translate(0,-39)"
                            >
                              <rect
                                x="-23"
                                y="-10"
                                width="46"
                                height="17"
                                rx="5"
                              />
                              <text textAnchor="middle" dy="1">
                                {n.id === start && n.id === goal
                                  ? "START / GOAL"
                                  : n.id === start
                                    ? "START"
                                    : "GOAL"}
                              </text>
                            </g>
                          )}
                          <text
                            className="graph-node-score"
                            textAnchor="middle"
                            y="46"
                          >
                            {informed
                              ? `h=${h[n.id]} · g=${fmt(f.costs[n.id])}`
                              : `g = ${fmt(f.costs[n.id])}`}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="graph-bottom">
                  <div className="search-legend">
                    <span>
                      <i className="legend-current" />
                      Current
                    </span>
                    <span>
                      <i className="frontier-dot" />
                      Frontier
                    </span>
                    <span>
                      <i className="legend-visited" />
                      Expanded
                    </span>
                    <span>
                      <i className="legend-path" />
                      Final route
                    </span>
                  </div>
                  <div className="zoom-controls">
                    <button
                      aria-label="Zoom graph out"
                      disabled={zoom <= 0.75}
                      onClick={() => setZoom((v) => Math.max(0.75, v - 0.25))}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      className="zoom-value"
                      aria-label="Fit graph"
                      title="Fit graph"
                      onClick={() => setZoom(1)}
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      aria-label="Zoom graph in"
                      disabled={zoom >= 2}
                      onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="route-strip">
                  <Route size={15} />
                  <span>
                    {f.type === "goal"
                      ? f.path.join(" → ")
                      : f.type === "failed"
                        ? "No route connects these nodes."
                        : "Your route will take shape here."}
                  </span>
                  {f.type === "goal" && <strong>Cost {f.cost}</strong>}
                </div>
              </div>
            ) : (
              <div className="search-compare">
                <div className="compare-eyebrow">
                  <Layers size={15} />
                  ONE GRAPH. FIVE WAYS THROUGH.
                </div>
                <h3>
                  A different priority.
                  <br />A different journey.
                </h3>
                <p>
                  Full searches on your current graph, start, goal, and
                  heuristic.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Expanded</th>
                      <th>Cost</th>
                      <th>Route</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map(({ id, meta, result }) => (
                      <tr
                        key={id}
                        className={
                          algorithm === id ? "selected-comparison" : ""
                        }
                      >
                        <td>
                          <button
                            onClick={() => {
                              changeAlgorithm(id);
                              setTab("graph");
                            }}
                          >
                            {meta.short}
                            <ArrowUpRight size={12} />
                          </button>
                        </td>
                        <td>
                          {result.expansions} / {graph.nodes.length}
                        </td>
                        <td>{result.found ? result.cost : "—"}</td>
                        <td>
                          {result.found ? result.path.join(" → ") : "No route"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="compare-footnote">
                  <Sparkles size={15} />
                  Fewest expansions does not always mean the cheapest route.
                </div>
              </div>
            )}
            <Playback playback={p} />
          </div>
          <aside className="inspector search-inspector">
            <div className="panel-heading">
              <span className="live-dot" />
              <h2>Behind the search</h2>
            </div>
            <div className="step-story">
              <div className="step-kicker">
                STEP {String(p.step).padStart(2, "0")}
                <ArrowUpRight size={14} />
              </div>
              <h3>{f.title}</h3>
              <p aria-live="polite">{f.description}</p>
            </div>
            <div className="node-inspector">
              <div className="inspector-label">
                {selected ? "SELECTED NODE" : "CURRENT NODE"}
                {selected && (
                  <button
                    aria-label="Follow search node"
                    onClick={() => setSelected(null)}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="current-node">
                <span className="node-badge">{nodeId}</span>
                <div>
                  <strong>
                    {nodeId === goal
                      ? "Goal node"
                      : nodeId === start
                        ? "Start node"
                        : `${neighbors(graph, nodeId).length} connections`}
                  </strong>
                  <span>
                    {f.closed.includes(nodeId)
                      ? "Expanded"
                      : f.discovered.includes(nodeId)
                        ? "On the frontier"
                        : "Not yet discovered"}
                  </span>
                </div>
              </div>
              <div className="search-score-grid">
                {[
                  ["g", g, "Cost so far"],
                  ["h", h[nodeId], "Estimated left"],
                  ["f", score, "g + h"],
                ].map(([label, value, hint]) => (
                  <div
                    key={label}
                    className={!informed && label !== "g" ? "score-muted" : ""}
                  >
                    <label>{label}(n)</label>
                    <strong>
                      {!informed && label !== "g" ? "—" : fmt(value)}
                    </strong>
                    <small>{hint}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="frontier-panel">
              <div className="inspector-label">
                {info.frontier.toUpperCase()}
                <span>{f.frontier.length} waiting</span>
              </div>
              <p className="frontier-hint">Next to expand comes first ↓</p>
              <div className="frontier-chips">
                {f.frontier.length ? (
                  f.frontier.map((item, i) => (
                    <div
                      key={item.id}
                      className={i === 0 ? "next-in-line" : ""}
                    >
                      <span>{item.id}</span>
                      <small>{priorityLabel(algorithm, item)}</small>
                      {i === 0 && <ArrowRight size={12} />}
                    </div>
                  ))
                ) : (
                  <p>{p.step === 0 ? "Ready" : "Empty frontier"}</p>
                )}
              </div>
            </div>
            <div className="search-progress">
              <div className="metric-row">
                <span>Nodes expanded</span>
                <strong>
                  {f.expansions}
                  <span> / {graph.nodes.length}</span>
                </strong>
              </div>
              <div className="metric-row">
                <span>Peak frontier</span>
                <strong>{f.peak}</strong>
              </div>
              <div className="metric-row">
                <span>Route cost</span>
                <strong className={f.found ? "result-value" : ""}>
                  {f.found ? f.cost : "—"}
                </strong>
              </div>
            </div>
            <button className="code-button" onClick={() => setModal("code")}>
              <Code2 size={16} />
              <span>Follow the pseudocode</span>
              <ArrowUpRight size={14} />
            </button>
            <p className="inspector-tip">
              <MousePointer2 size={12} />
              Click any node to inspect it.
            </p>
          </aside>
        </section>
        <div className="under-workspace">
          <span>
            <span className="keyboard-key">←</span>
            <span className="keyboard-key">→</span>to step through
            <i />
            <span className="keyboard-key">space</span>to play / pause
          </span>
          <span>
            Not just where you go. Why you go there.
            <Sparkles size={13} />
          </span>
        </div>
        <section className="algorithm-details" id="search-theory">
          <div className="learn-intro">
            <div className="eyebrow">THE STRATEGY BEHIND THE STEPS</div>
            <h2>{info.name}. One simple rule.</h2>
            <p>{info.rule}.</p>
          </div>
          <p className="algorithm-description">{info.description}</p>
          <div className="property-cards">
            {[
              [
                "Complete?",
                info.complete,
                "Will it find a route if one exists?",
              ],
              [
                "Optimal?",
                algorithm === "astar" && !checks.admissible
                  ? "Not with these estimates"
                  : info.optimal,
                "Will it guarantee the cheapest route?",
              ],
              ["Time", info.time, "Standard finite-graph implementation²"],
              [
                "Space",
                algorithm === "astar" && !checks.consistent
                  ? "May grow with reopenings"
                  : info.space,
                "Search memory, excluding animation history",
              ],
            ].map(([label, value, note]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </article>
            ))}
          </div>
          <div className="theory-grid">
            <article>
              <div className="eyebrow">01 / THE FRONTIER</div>
              <h3>What gets explored next?</h3>
              <p>
                BFS takes the oldest entry. DFS takes the newest. UCS takes the
                cheapest path so far. Greedy follows the smallest estimate. A*
                adds both costs together.
              </p>
              <div className="theory-formula">
                UCS: g(n)<span>Greedy: h(n)</span>
                <strong>A*: g(n) + h(n)</strong>
              </div>
            </article>
            <article>
              <div className="eyebrow">02 / A HELPFUL GUESS</div>
              <h3>A good heuristic knows its limits.</h3>
              <p>
                An admissible h(n) never exceeds the true remaining cost. The
                automatic teaching estimate is 85% of a precomputed shortest
                distance, rounded down. Real problems supply a domain-specific
                estimate.
              </p>
              <p className="theory-small">
                ¹ A* reopens a state if a cheaper route is found. With a
                consistent heuristic, reopening is unnecessary. Custom
                overestimates can make A* return a suboptimal route.
              </p>
            </article>
          </div>
          <div className="theory-table-wrap">
            <h3>The bigger picture</h3>
            <p>
              All five searches use a visited set on this finite graph. That
              makes DFS and greedy complete here, unlike their unrestricted
              infinite-tree versions.
            </p>
            <table className="theory-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Priority</th>
                  <th>Complete here?</th>
                  <th>Cheapest route?</th>
                  <th>Graph time²</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SEARCH_ALGORITHMS).map(([id, a]) => (
                  <tr
                    key={id}
                    className={id === algorithm ? "highlight-row" : ""}
                  >
                    <td>{a.short}</td>
                    <td>{a.rule}</td>
                    <td>Yes</td>
                    <td>
                      {id === "bfs"
                        ? "Equal costs only"
                        : id === "dfs" || id === "greedy"
                          ? "Not guaranteed"
                          : id === "astar"
                            ? "Admissible h(n)¹"
                            : "Yes"}
                    </td>
                    <td>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="theory-small">
              V = vertices; E = edges. Positive edge costs are enforced. ²
              Bounds assume adjacency lists and, where needed, a binary heap;
              animation snapshots and sorting neighbors add overhead. A* with a
              consistent heuristic has O((V + E) log V) time; inconsistent
              estimates can cause many reopenings and exponential work.
            </p>
            <details>
              <summary>
                How do these compare with textbook tree-search bounds?
              </summary>
              <div className="tree-bounds">
                {Object.entries(SEARCH_ALGORITHMS).map(([id, a]) => (
                  <div key={id}>
                    <strong>{a.short}</strong>
                    <span>Time: {a.treeTime}</span>
                    <span>Space: {a.treeSpace}</span>
                  </div>
                ))}
              </div>
              <p className="theory-small">
                b = branching factor; d = shallowest goal depth; m = maximum
                search depth; C* = optimal path cost; ε = smallest positive edge
                cost. DFS’s O(bm) tree-space bound excludes a graph-wide visited
                set. Finite graph bounds and implicit search-tree bounds
                describe different models.
              </p>
            </details>
          </div>
        </section>
        <Footer onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        {modal && (
          <Modal
            title={
              modal === "code"
                ? `The ${info.short} playbook.`
                : "Different priorities. Different paths."
            }
            onClose={() => setModal(null)}
          >
            {modal === "code" ? (
              <>
                <p className="modal-intro">
                  {info.rule}. Step {p.step} of {p.last}.
                </p>
                <div className="pseudocode">
                  {pseudo[algorithm].map((line, i) => (
                    <div
                      key={line}
                      className={f.line === i ? "code-active" : ""}
                    >
                      <span>{i + 1}</span>
                      <code>{line}</code>
                    </div>
                  ))}
                </div>
                <p className="code-explanation">{f.description}</p>
                <div className="modal-playback">
                  <button onClick={() => p.move(-1)} disabled={!p.step}>
                    Previous
                  </button>
                  <button
                    onClick={() => p.move(1)}
                    disabled={p.step === p.last}
                  >
                    Next step
                    <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-intro">
                  The numbers on edges are travel costs. The goal is to connect
                  the start and goal; each strategy chooses its next node
                  differently.
                </p>
                <ol className="guide-list">
                  <li>
                    <span>1</span>
                    <div>
                      <h3>Pick your priorities</h3>
                      <p>
                        Choose BFS, DFS, UCS, A*, or greedy best-first.
                        Alphabetical neighbor order makes runs repeatable; equal
                        priorities keep insertion order.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <h3>Watch the frontier</h3>
                      <p>
                        The inspector shows the actual queue, stack, or priority
                        queue. The first entry is the next one expanded.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <h3>Change the question</h3>
                      <p>
                        Edit weights, swap start and goal, or try an unreachable
                        graph. A* and greedy also let you edit heuristic
                        estimates.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>4</span>
                    <div>
                      <h3>Compare the results</h3>
                      <p>
                        The Compare tab runs all five strategies on this same
                        setup. Compare route cost and expanded nodes, not just
                        speed.
                      </p>
                    </div>
                  </li>
                </ol>
                <button
                  className="primary-button"
                  onClick={() => setModal(null)}
                >
                  Find your way
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </Modal>
        )}
      </main>
    </>
  );
}
function priorityLabel(algorithm, item) {
  return algorithm === "astar"
    ? `f=${item.f}`
    : algorithm === "ucs"
      ? `g=${item.g}`
      : algorithm === "greedy"
        ? `h=${item.h}`
        : `depth ${item.depth}`;
}
