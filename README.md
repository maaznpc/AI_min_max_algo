# Branch — Algorithms, made visible

An interactive website for learning adversarial search, graph search, and evolutionary algorithms. All three playgrounds share the same calm green design and are accessible from the header. Reference material inspired the topics; graph and evolutionary examples are original, working simulations.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm ci
npm run dev -- --port 5173
```

The Vite server listens on all interfaces. There is no backend, database, API key, or runtime service dependency. Fonts are bundled locally.

## Explore

- Choose minimax or alpha–beta, a preset, tree depth (2–4 ply), branching factor (2–3), root player, and traversal order.
- Edit leaf values or randomize them. Trees support up to 121 nodes and 81 leaves.
- Play, pause, step forward/back, scrub the timeline, or jump to the result. Space toggles playback; arrow keys step; R resets.
- Watch scores propagate, live alpha/beta bounds change, branches get pruned, and the final best path emerge.
- Click a node to inspect it. Zoom controls and a scrollable canvas support larger trees and small screens.
- Open the pseudocode to follow the current operation, or compare the actual work done by both algorithms on your tree.

The lecture example returns **3**. Minimax evaluates all **8** leaves and **15** nodes; alpha–beta evaluates **5** leaves and **11** nodes. A cutoff value is explicitly shown as a lower (`≥`) or upper (`≤`) bound, rather than an exact value.

### Graph search — `#/search`

Explore BFS, DFS, UCS, A*, and greedy best-first on editable weighted graphs. Follow the real frontier, expanded nodes, parent updates, route costs, and pseudocode. Choose start and goal, edit weights or heuristic estimates, compare all five searches, and try an unreachable goal. Completeness, optimality, graph complexity, and textbook tree-search bounds are explained below.

The garden example deliberately separates fewest edges from cheapest cost: BFS returns a 3-edge route costing 13, while UCS and A* return a 4-edge route costing 7. A* supports reopening improved states. Automatic heuristics are lower bounds generated from precomputed goal distances for teaching; custom overestimates are flagged.

### Evolutionary N-Queens — `#/queens`

Play with 4, 6, 8, or 10 queens, or evolve a solution using a real genetic algorithm. Control population size, per-gene mutation probability, parent selection (tournament or roulette), generation limit, and random seed. The best two boards survive by elitism. There is no stored solution or hidden backtracking solver.

Follow every generation, inspect population members, see fitness and conflicts, and trace actual parents, one-point crossover, and mutation for a fittest newborn below the board. The manual game lets you move queens and seed a new population with your arrangement. The default 8-queens run (seed 12) solves in 27 generations; other runs can reach the limit without solving. Fitness is the number of non-attacking queen pairs.

## Validate and build

```sh
npm test           # 18 algorithm tests, including reference comparisons
npm run test:e2e   # 11 desktop/mobile browser interaction tests
npm run build     # static production output in dist/
npm run preview   # serve the production build
```

Browser tests use `/usr/bin/chromium` when available. Otherwise install Playwright's browser with `npx playwright install chromium` before running them. The application does not require a browser installation to build.

## Publish on GitHub Pages

```sh
npm run deploy
```

This builds the site and publishes the static output to the `gh-pages` branch using your existing GitHub Git authentication. It does not change the source branch. Run it again after website updates to publish a new version.

For first-time activation, open the repository's **Settings → Pages**, choose **Deploy from a branch**, and select **gh-pages / (root)**. The project website address is `https://maaznpc.github.io/AI_min_max_algo/` once GitHub finishes publishing. The Vite configuration uses relative asset paths so scripts, styles, fonts, and the favicon load under this project path.

## Implementation

React, Vite, Lucide icons, custom responsive SVG graphs, and an interactive chessboard. `src/algorithm.js`, `src/search.js`, and `src/evolution.js` contain the algorithms and independent snapshots for reversible playback. `src/shared.jsx` supplies navigation, dialogs, and playback; the new playgrounds are lazy-loaded. Hash routes work on GitHub Pages without server rewrites. All computation and bundled fonts run locally in the browser.
