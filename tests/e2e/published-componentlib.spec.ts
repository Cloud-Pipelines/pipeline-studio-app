import { expect, type Page, test } from "@playwright/test";

import {
  createNewPipeline,
  dragComponentToCanvas,
  locateFolderByName,
  openComponentLibFolder,
  removeComponentFromCanvas,
} from "./helpers";

/**
 * Due to the time it takes to load the library, the tests are run in serial
 *  and one page is used for all the tests.
 *
 * So every test must clean up after itself
 */
test.describe.configure({ mode: "serial" });

test.describe("Published Component Library", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await createNewPipeline(page);

    await expect(page.locator("[data-testid='search-input']")).toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("standard library successfully loads", async () => {
    await openComponentLibFolder(page, "Standard library");

    const standardLibraryFolders = [
      "Quick start",
      "Basics",
      "Datasets",
      "Data manipulation",
      "Upload/Download",
      "ML frameworks",
      "ML Metrics",
      "Converters",
    ];

    // expect to see all the folders
    for (const folder of standardLibraryFolders) {
      const folderContainer = await locateFolderByName(page, folder);
      await expect(folderContainer).toBeVisible();
    }
  });

  test("folder can be expanded and collapsed", async () => {
    const folder = await locateFolderByName(page, "Inputs & Outputs");
    await expect(folder.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await openComponentLibFolder(page, "Inputs & Outputs");

    await expect(folder.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(folder.locator("li")).toHaveCount(2);

    await folder.getByRole("button").click();
    await expect(folder.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("user can navigate nested folders", async () => {
    await openComponentLibFolder(page, "Standard library");

    const frameworksFolder = await openComponentLibFolder(
      page,
      "ML frameworks",
    );
    await expect(frameworksFolder.locator("[data-folder-name]")).toHaveCount(6);

    const xgboostFolder = await openComponentLibFolder(page, "XGBoost");
    await expect(xgboostFolder.getByTestId("component-item")).toHaveCount(4);
  });

  test("library can be searched", async () => {
    // search for a component
    await searchForComponent(page, "GCS");

    const searchResultsHeader = page.getByTestId("search-results-header");
    await expect(searchResultsHeader).toBeVisible();
    await expect(searchResultsHeader).toHaveText("Search Results (10 of 13)");

    const componentItem = page.getByTestId("component-item");
    await expect(componentItem).toHaveCount(10);

    await clearSearch(page);
  });

  test("components from search results can be favorited and unfavorited", async () => {
    await searchForComponent(page, "GCS");

    const downloadFromGCS = await findComponentFromSearchResults(
      page,
      "Download from GCS",
    );
    const favoriteButton = downloadFromGCS.getByTestId("favorite-star");
    const favoriteIcon = favoriteButton.locator("svg");

    await expect(favoriteIcon).toHaveAttribute("fill", "none");
    await favoriteButton.click();
    await expect(favoriteIcon).not.toHaveAttribute("fill", "none");

    await favoriteButton.click();
    await expect(favoriteIcon).toHaveAttribute("fill", "none");

    await clearSearch(page);
  });

  test("component details can be opened as a dialog", async () => {
    await searchForComponent(page, "GCS");

    const downloadFromGCS = await findComponentFromSearchResults(
      page,
      "Download from GCS",
    );
    await downloadFromGCS.getByTestId("info-icon-button").click();

    await expect(page.getByTestId("component-details-tabs")).toBeVisible();

    const dialog = page.getByTestId("component-details-dialog");
    const dialogHeader = dialog.locator('[data-slot="dialog-header"]');
    await expect(dialogHeader).toBeVisible();

    await expect(dialogHeader).toHaveText("Download from GCS");

    await page.locator('button[data-slot="dialog-close"]').click();

    await expect(dialogHeader).toBeHidden();

    await clearSearch(page);
  });

  test("components from search results can be dragged to the canvas", async () => {
    await searchForComponent(page, "GCS");

    const downloadFromGCS = await findComponentFromSearchResults(
      page,
      "Download from GCS",
    );
    await dragComponentToCanvas(page, downloadFromGCS);

    await clearSearch(page);

    const node = page.locator('[data-task-name="Download from GCS"]');
    await expect(node).toBeVisible();

    await removeComponentFromCanvas(page, "Download from GCS");
  });
});

async function searchForComponent(page: Page, componentName: string) {
  await page.getByTestId("search-input").fill(componentName);
  await expect(page.getByTestId("search-results-container")).toBeVisible();
}

async function clearSearch(page: Page) {
  await page.getByTestId("search-input").clear();

  const searchResultsHeader = page.getByTestId("search-results-header");
  await expect(searchResultsHeader).toBeHidden();
}

async function findComponentFromSearchResults(
  page: Page,
  componentName: string,
) {
  const container = page.getByTestId("search-results-container");
  const component = container.locator(
    `[data-component-name="${componentName}"]`,
  );
  return component;
}
