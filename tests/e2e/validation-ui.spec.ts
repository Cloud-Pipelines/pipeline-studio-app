import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  createNewPipeline,
  dropComponentFromLibraryOnCanvas,
  fitToView,
  openComponentLibFolder,
  panCanvas,
  waitForContextPanel,
} from "./helpers";

const CHICAGO_TAXI_COMPONENT = "Chicago Taxi Trips dataset";
const XGBOOST_COMPONENT = "Train XGBoost model on CSV";

function locateTaskNode(page: Page, taskName: string): Locator {
  return page.locator(`[data-task-name="${taskName}"]`);
}

async function expectValidationState(
  page: Page,
  expectedText: string,
): Promise<void> {
  await page.keyboard.press("Escape");
  const pipelineDetails = await waitForContextPanel(page, "pipeline-details");
  await expect(
    pipelineDetails.getByText(expectedText, { exact: true }),
    `Validation should show "${expectedText}"`,
  ).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.describe("Pipeline Validation UI", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await createNewPipeline(page);
    await openComponentLibFolder(page, "Standard library");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("shows no validation issues for single component without required inputs", async () => {
    await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      CHICAGO_TAXI_COMPONENT,
    );

    const pipelineDetails = await waitForContextPanel(page, "pipeline-details");
    await expect(
      pipelineDetails.getByText("No validation issues", { exact: true }),
    ).toBeVisible();
  });

  test("shows 2 errors when adding component with missing required inputs", async () => {
    const taxiNode = locateTaskNode(page, CHICAGO_TAXI_COMPONENT);
    const taxiNodeBox = await taxiNode.boundingBox();

    // eslint-disable-next-line playwright/no-conditional-in-test -- Explicit null check for boundingBox() per Playwright best practices
    if (!taxiNodeBox) {
      throw new Error("Unable to get bounding box for Chicago Taxi node");
    }

    await panCanvas(page, -taxiNodeBox.width, 0);

    await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      XGBOOST_COMPONENT,
      {
        targetPosition: { x: taxiNodeBox.width * 1.5, y: taxiNodeBox.y },
      },
    );

    const pipelineDetails = await waitForContextPanel(page, "pipeline-details");
    await expect(
      pipelineDetails.getByText("2 errors", { exact: true }),
    ).toBeVisible();
  });

  test("shows expanded view of validation errors", async () => {
    const pipelineDetails = await waitForContextPanel(page, "pipeline-details");
    await pipelineDetails.getByRole("button", { name: "2 errors" }).click();

    const validationIssues = pipelineDetails.getByRole("button", {
      name: /^TASK /,
    });
    await expect(validationIssues).toHaveCount(2);
  });

  test("clicking validation error navigates to task on canvas", async () => {
    const xgboostNode = locateTaskNode(page, XGBOOST_COMPONENT);
    const pipelineDetails = await waitForContextPanel(page, "pipeline-details");
    const validationIssues = pipelineDetails.getByRole("button", {
      name: /^TASK /,
    });
    await validationIssues.first().click();

    await expect(
      xgboostNode,
      "Node should be in viewport after clicking validation issue",
    ).toBeInViewport();
  });

  test("connecting nodes reduces validation errors to 1", async () => {
    await fitToView(page);

    const taxiNode = locateTaskNode(page, CHICAGO_TAXI_COMPONENT);
    const xgboostNode = locateTaskNode(page, XGBOOST_COMPONENT);

    const outputPin = taxiNode.locator('[data-handleid="output_Table"]');
    const inputPin = xgboostNode.locator(
      '[data-handleid="input_training_data"]',
    );

    await expect(outputPin).toBeInViewport();
    await expect(inputPin).toBeInViewport();

    await outputPin.hover();
    await page.mouse.down();
    await inputPin.hover();
    await page.mouse.up();

    await expect(
      page.locator(".react-flow__edge"),
      "Edge should be created after connection",
    ).toHaveCount(1);

    await expectValidationState(page, "1 error");
  });

  test("creating input node via CMD+drag changes validation to 1 warning", async () => {
    await fitToView(page);

    const xgboostNode = locateTaskNode(page, XGBOOST_COMPONENT);

    const labelColumnHandle = xgboostNode.locator(
      '[data-handleid="input_label_column_name"]',
    );

    await expect(labelColumnHandle).toBeInViewport();

    const handleBox = await labelColumnHandle.boundingBox();
    // eslint-disable-next-line playwright/no-conditional-in-test -- Explicit null check for boundingBox() per Playwright best practices
    if (!handleBox) {
      throw new Error(
        "Unable to get bounding box for label_column_name handle",
      );
    }

    await page.keyboard.down("Meta");

    await labelColumnHandle.hover();
    await page.mouse.down();

    await page.mouse.move(
      handleBox.x - 150,
      handleBox.y + handleBox.height / 2,
      { steps: 10 },
    );

    await page.mouse.up();

    await page.keyboard.up("Meta");

    const inputNode = page.locator(
      '[data-tour-card="input"][data-tour-card-name="label_column_name"]',
    );
    await expect(
      inputNode,
      "Input node should be created for label_column_name",
    ).toBeVisible();

    await expectValidationState(page, "1 warning");
  });

  test("setting input value resolves all validation issues", async () => {
    const inputNode = page.locator(
      '[data-tour-card="input"][data-tour-card-name="label_column_name"]',
    );
    await inputNode.click();

    const inputValueField = page.getByTestId("input-value");
    await expect(
      inputValueField,
      "Input value editor should appear in context panel",
    ).toBeVisible();

    await inputValueField.fill("tips");
    await inputValueField.blur();

    await expectValidationState(page, "No validation issues");
  });
});
