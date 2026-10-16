import { test, expect } from "@playwright/test";
test("header navigates between all three playgrounds and hash routes survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Graph search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Many paths. Find your way." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Many paths. Find your way." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "N-Queens", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Better boards. One generation at a time.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Minimax", exact: true }).click();
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is 3",
  );
});
test("all five graph searches run and expose real route costs, frontier states and pseudocode", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/search");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".step-story h3")).toContainText("Take S");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".route-strip")).toContainText("Cost 13");
  for (const [name, cost] of [
    ["UCS", 7],
    ["A*", 7],
    ["DFS", 13],
    ["Greedy", 13],
  ]) {
    await page
      .locator(".algorithm-list button")
      .filter({
        has: page.locator(".algorithm-abbr", {
          hasText: new RegExp(`^${name.replace("*", "\\*")}$`),
        }),
      })
      .click();
    await page.getByRole("button", { name: "Jump to result" }).click();
    await expect(page.locator(".route-strip")).toContainText(`Cost ${cost}`);
  }
  await page.getByRole("tab", { name: "Compare all five" }).click();
  await expect(page.locator(".search-compare tbody tr")).toHaveCount(5);
  await page.getByRole("tab", { name: "Graph visualization" }).click();
  await page.getByRole("button", { name: "Follow the pseudocode" }).click();
  await expect(page.locator(".code-active")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator(".frontier-chips")).toContainText("S");
  expect(errors).toEqual([]);
});
test("graph edits, custom heuristic warnings, unreachable goals, and identical endpoints work", async ({
  page,
}) => {
  await page.goto("/#/search");
  await page
    .locator(".algorithm-list button")
    .filter({ hasText: "A*" })
    .click();
  await page.getByLabel("Heuristic h(n)").selectOption("custom");
  await page.getByLabel("Heuristic for A").fill("99");
  await expect(page.locator(".heuristic-note")).toContainText(
    "can overestimate",
  );
  await page.getByLabel("Heuristic h(n)").selectOption("zero");
  await page.getByLabel("Weight C-S").fill("20");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".route-strip")).toContainText("Cost 9");
  await page.getByLabel("Start with a graph").selectOption("islands");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "frontier is empty",
  );
  await page.getByLabel("Goal node").selectOption("S");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".route-strip")).toContainText("Cost 0");
});
test("evolution shows a real solved generation, operator trace, selectable population and reproducible rewind", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/queens");
  await expect(page.getByRole("gridcell")).toHaveCount(64);
  await page.getByRole("button", { name: "Next generation" }).click();
  await expect(page.locator(".operator-card")).toHaveCount(3);
  await expect(page.locator(".gene-cut")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "All queens. No quarrels.",
  );
  await expect(page.locator(".fitness-display strong")).toContainText("28");
  await page.getByRole("button", { name: /Inspect candidate 2,/ }).click();
  await expect(page.locator(".canvas-label")).toContainText(
    "POPULATION CANDIDATE",
  );
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator(".step-story h3")).toContainText("variety");
  await expect(page.locator(".initial-generation")).toBeVisible();
  expect(errors).toEqual([]);
});
test("manual queens puzzle accepts user moves, detects a solution and seeds evolution", async ({
  page,
}) => {
  await page.goto("/#/queens");
  await page.getByRole("button", { name: "4 by 4 board" }).click();
  await page.getByRole("tab", { name: "Try it yourself" }).click();
  for (const [column, row] of [
    ["A", 2],
    ["B", 4],
    ["C", 1],
    ["D", 3],
  ])
    await page
      .getByRole("gridcell", {
        name: new RegExp(`^Column ${column}, row ${row}(, queen)?$`),
      })
      .click();
  await expect(page.locator(".manual-banner")).toContainText(
    "You found a valid solution",
  );
  await expect(page.locator(".fitness-display strong")).toContainText("6");
  await page.getByRole("button", { name: "Evolve from my board" }).click();
  await expect(
    page.getByRole("tab", { name: "Evolution lab" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".step-story h3")).toContainText(
    "All queens. No quarrels.",
  );
});
test("new playgrounds remain within a mobile viewport and their controls work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["search", "queens"]) {
    await page.goto(`/#/${route}`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await page.getByRole("button", { name: "Jump to result" }).click();
    await expect(page.locator(".step-story h3")).toBeVisible();
    await page.getByRole("button", { name: "Quick guide" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
