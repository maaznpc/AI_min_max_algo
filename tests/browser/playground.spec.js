import { test, expect } from "@playwright/test";

test("lecture tree is an interactive SVG with correct result and highlighted pruning", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Minimax, made visible." }),
  ).toBeVisible();
  await expect(page.locator(".tree-node")).toHaveCount(15);
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".step-story h3")).toContainText("Explore A");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is 3",
  );
  await expect(page.locator(".node-pruned")).toHaveCount(4);
  await expect(page.locator(".node-best")).toHaveCount(4);
  await expect(page.locator(".metric-row").first()).toContainText("5 / 8");
  await page
    .getByRole("button", { name: "Previous step", exact: true })
    .click();
  await expect(page.locator(".status-pill")).toContainText("Paused");
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator(".node-pruned")).toHaveCount(0);
  await expect(page.locator(".step-story h3")).toContainText(
    "Every decision starts here",
  );
  expect(errors).toEqual([]);
});

test("minimax, comparison, and custom leaf values produce real recalculated results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Minimax", exact: true }).click();
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".metric-row").first()).toContainText("8 / 8");
  await expect(page.locator(".node-pruned")).toHaveCount(0);
  await page.getByRole("tab", { name: "Compare" }).click();
  await expect(page.locator(".compare-view")).toContainText("27%");
  await expect(page.locator(".comparison-chart")).toContainText(
    "11 / 15 nodes visited",
  );
  await page.getByLabel("Leaf 1 value", { exact: true }).fill("20");
  await page.getByLabel("Leaf 2 value", { exact: true }).fill("20");
  await page.getByRole("tab", { name: "Tree visualization" }).click();
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is 9",
  );
  await page.getByRole("button", { name: "MIN", exact: true }).click();
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is 5",
  );
});

test("playback, keyboard shortcuts, scrubbing and pseudocode work", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("body").click({ position: { x: 15, y: 150 } });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Timeline step")).toHaveValue("1");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Timeline step")).toHaveValue("0");
  await page.keyboard.press("Space");
  await expect(page.locator(".status-pill")).toContainText("Running");
  await expect
    .poll(() => page.getByLabel("Timeline step").inputValue())
    .not.toBe("0");
  await page.getByRole("button", { name: "Pause", exact: false }).click();
  await expect(page.locator(".status-pill")).toContainText("Paused");
  await page.getByRole("button", { name: "Follow the pseudocode" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".code-active")).toHaveCount(1);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Next step" })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Timeline step").focus();
  await page.keyboard.press("End");
  await expect(page.locator(".status-pill")).toContainText("Complete");
});

test("presets, root changes, larger trees, randomizing and node inspection work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Start with a tree").selectOption("negative");
  await expect(page.getByLabel("Leaf 1 value", { exact: true })).toHaveValue(
    "-5",
  );
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is -1",
  );
  await page
    .getByRole("button", { name: "Node B, MIN, value -2", exact: true })
    .click();
  await expect(page.locator(".inspector-label").first()).toContainText(
    "SELECTED NODE",
  );
  await page.getByRole("button", { name: "Follow current node" }).click();
  await expect(page.locator(".inspector-label").first()).toContainText(
    "CURRENT NODE",
  );
  await page.getByLabel("Tree depth").selectOption("4");
  await page.getByLabel("Branches", { exact: true }).selectOption("3");
  await expect(page.locator(".tree-node")).toHaveCount(121);
  await expect(page.locator(".leaf-inputs input")).toHaveCount(81);
  await page.getByLabel("Traversal order").selectOption("right");
  await page.getByRole("button", { name: "Randomize values" }).click();
  await expect(page.getByLabel("Start with a tree")).toHaveValue("custom");
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".status-pill")).toContainText("Complete");
  await page.getByRole("button", { name: "Reset to lecture example" }).click();
  await expect(page.locator(".tree-node")).toHaveCount(15);
  await page.getByRole("button", { name: "Expand workspace" }).click();
  await expect(page.locator(".workspace")).toHaveClass(/workspace-full/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).not.toHaveClass(/workspace-full/);
});

test("mobile layout stays within the viewport and supports the complete interaction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Jump to result" }).click();
  await expect(page.locator(".step-story h3")).toContainText(
    "optimal value is 3",
  );
  await page.getByRole("button", { name: "Quick guide" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Let’s explore" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Branches", { exact: true }).selectOption("3");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
