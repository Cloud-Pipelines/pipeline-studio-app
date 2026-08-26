import { expect, test } from "@playwright/test";

import {
  clickOnCanvas,
  createNewPipeline,
  dropComponentFromLibraryOnCanvas,
  fitToView,
  locateFlowCanvas,
  locateFlowViewport,
  openComponentLibFolder,
  panCanvas,
  zoomIn,
  zoomOut,
} from "./helpers";

test.describe("FlowCanvas Basic Functionality", () => {
  test("should load pipeline editor and allow basic node interaction", async ({
    page,
  }) => {
    await createNewPipeline(page);

    await expect(locateFlowCanvas(page)).toBeVisible();
    await expect(locateFlowViewport(page)).toBeVisible();

    // Check React Flow UI components
    await expect(page.locator(".react-flow__minimap")).toBeVisible();
    await expect(page.locator(".react-flow__background")).toBeVisible();
    await expect(page.locator(".react-flow__controls")).toBeVisible();

    // Test basic canvas interaction
    await clickOnCanvas(page, 400, 300);

    // Test canvas panning
    await panCanvas(page, 50, 50);

    // Test zoom controls
    await zoomIn(page);
    await zoomOut(page);
  });

  test("should place a node on the canvas after standard library is loaded", async ({
    page,
  }) => {
    await createNewPipeline(page);
    await openComponentLibFolder(page, "Standard library");

    const node = await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      "Chicago Taxi Trips dataset",
    );

    await expect(node).toBeVisible();

    await node.click();

    await expect(node.locator('[data-tour-card="task"]')).toHaveClass(
      /ring-edge-selected/,
    );
  });

  test("should connect two nodes satisfying the required field requirements", async ({
    page,
  }) => {
    await createNewPipeline(page);
    await openComponentLibFolder(page, "Standard library");

    const nodeA = await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      "Chicago Taxi Trips dataset",
    );

    // TODO: Create more reliable way to position nodes accounting for canvas transform
    const nodeABox = await nodeA.boundingBox();
    // eslint-disable-next-line playwright/no-conditional-in-test -- Necessary null check for boundingBox() return value
    if (!nodeABox) {
      throw new Error("Unable to get bounding box for nodeA");
    }

    await panCanvas(page, -nodeABox.width, 0);

    const nodeB = await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      "Train XGBoost model on CSV",
      {
        targetPosition: { x: nodeABox.width * 1.5, y: nodeABox.y },
      },
    );

    await expect(nodeA).toBeVisible();
    await expect(nodeB).toBeVisible();

    const outputPin = nodeA.locator('[data-handleid="output_Table"]');
    const inputPin = nodeB.locator('[data-handleid="input_training_data"]');

    await fitToView(page);

    await expect(outputPin).toBeInViewport();
    await expect(inputPin).toBeInViewport();
    await expect(inputPin).toHaveClass(/bg-red-700/);

    await outputPin.hover();
    await page.mouse.down();
    await inputPin.hover();
    await page.mouse.up();

    await expect(inputPin).not.toHaveClass(/bg-red-700/);

    await expect(page.locator(".react-flow__edge")).toHaveCount(1);

    const inputHandle = nodeB.locator(
      '[data-testid="input-handle-training_data"]',
    );
    await expect(inputHandle).toBeVisible();

    await expect(
      nodeB.getByText("→ Chicago Taxi Trips dataset.Table"),
    ).toBeVisible();
  });
});
