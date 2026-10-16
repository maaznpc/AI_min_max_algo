# Branch — Minimax, made visible

An interactive website for learning minimax and alpha–beta pruning. The starting tree reproduces the uploaded lecture example: `2, 3, 5, 9, 0, 1, 7, 5`.

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

## Validate and build

```sh
npm test           # 6 algorithm tests, including 144 reference comparisons
npm run test:e2e   # 5 desktop/mobile browser interaction tests
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

React, Vite, Lucide icons, and a custom responsive SVG tree. `src/algorithm.js` builds a real game tree and records independent search snapshots, making backward stepping deterministic. `src/main.jsx` renders the visualization, explanations, controls, comparison, and accessible dialogs. All algorithm computation runs in the browser.
