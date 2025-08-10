import { expect, type Page, test } from "@playwright/test";

import {
  createNewPipeline,
  dropComponentFromLibraryOnCanvas,
  locateComponentInFolder,
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

test.describe("Component Library", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Create new pipeline and wait for it to load
    await createNewPipeline(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("standard library successfully loads", async () => {
    const expectedFirstLevelFolders = [
      "Inputs & Outputs",
      "Quick start",
      "Datasets",
      "Data manipulation",
      "Upload/Download",
      "ML frameworks",
      "Converters",
      "Google Cloud",
    ];

    // expect to see all the folders
    for (const folder of expectedFirstLevelFolders) {
      const folderContainer = await locateFolderByName(page, folder);
      expect(folderContainer).toBeVisible();
    }

    // special folders are not rendered from the beginning
    const countOfFoldersByDefault = await page.locator("[data-folder-name]");
    expect(countOfFoldersByDefault).toHaveCount(
      expectedFirstLevelFolders.length,
    );
  });

  test("folder can be expanded and collapsed", async () => {
    // ensure no components are visible in the folder before it is expanded
    const inputsOutputsFolder = await locateFolderByName(
      page,
      "Inputs & Outputs",
    );
    expect(
      await inputsOutputsFolder
        .locator('[role="button"]')
        .getAttribute("aria-expanded"),
    ).toBe("false");
    const inputsOutputsFolderContent = await inputsOutputsFolder.locator("li");

    (await inputsOutputsFolderContent.all()).forEach(async (component) => {
      expect(await component.isVisible()).toBe(false);
    });

    // expand the folder
    await openComponentLibFolder(page, "Inputs & Outputs");

    expect(
      await inputsOutputsFolder
        .locator('[role="button"]')
        .getAttribute("aria-expanded"),
    ).toBe("true");

    // expect only two components in the folder
    const components = await inputsOutputsFolder.locator("li");
    expect(components).toHaveCount(2);

    await inputsOutputsFolder.locator('[role="button"]').click();

    await page.waitForTimeout(200);

    expect(
      await inputsOutputsFolder
        .locator('[role="button"]')
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  test("user can navigate deep into the nested folders", async () => {
    // navigate to the nested folder
    const topFolder = await openComponentLibFolder(page, "Google Cloud");
    const topFolderContent = await topFolder.locator("[data-folder-name]");
    expect(await topFolderContent).toHaveCount(3);

    const nestedFolder = await openComponentLibFolder(page, "Storage");

    const nestedFolderContent = await nestedFolder.locator(
      '[data-testid="component-item"]',
    );
    expect(await nestedFolderContent).toHaveCount(4);
  });

  test("components can be added and removed from favorites folder", async () => {
    // add component to the favorites by clicking the star icon
    const quickStartFolder = await openComponentLibFolder(page, "Quick start");
    const chicagoTaxiTripsDataset = await locateComponentInFolder(
      quickStartFolder,
      "Chicago Taxi Trips dataset",
    );
    await chicagoTaxiTripsDataset
      .locator('[data-testid="favorite-star"]')
      .click();

    // expect the component to be in the favorites folder
    const favoritesFolder = await openComponentLibFolder(page, "My Components");
    expect(await favoritesFolder.locator("li")).toHaveCount(1);

    // unstar the component
    await chicagoTaxiTripsDataset
      .locator('[data-testid="favorite-star"]')
      .click();

    // giving time for the component to be removed from the favorites folder
    // todo: find a better way to do this
    await page.waitForTimeout(200);

    // expect the component to be removed from the favorites folder
    expect(await favoritesFolder.locator("li")).toHaveCount(0);
  });

  test("component details can be opened as a dialog", async () => {
    // drop component on the canvas
    const quickStartFolder = await openComponentLibFolder(page, "Quick start");
    const chicagoTaxiTripsDataset = await locateComponentInFolder(
      quickStartFolder,
      "Chicago Taxi Trips dataset",
    );

    await chicagoTaxiTripsDataset
      .locator('[data-testid="info-icon-button"]')
      .click();

    await page.waitForTimeout(200);

    const dialogHeader = await page.locator('[data-slot="dialog-header"]');
    expect(dialogHeader).toBeVisible();

    expect(dialogHeader).toHaveText("Chicago Taxi Trips dataset");

    await page.locator('button[data-slot="dialog-close"]').click();

    await page.waitForTimeout(200);
  });

  test("components can be dragged to the canvas and appear in the used in pipeline folder", async () => {
    // drop component on the canvas
    await dropComponentFromLibraryOnCanvas(
      page,
      "Quick start",
      "Chicago Taxi Trips dataset",
    );

    const usedOnCanvasFolder = await openComponentLibFolder(
      page,
      "Used in Pipeline",
    );
    expect(await usedOnCanvasFolder.locator("li")).toHaveCount(1);

    // remove the component from the canvas
    await removeComponentFromCanvas(page, "Chicago Taxi Trips dataset");
    expect(await usedOnCanvasFolder.locator("li")).toHaveCount(0);
  });

  test("library can be searched", async () => {
    // search for a component
    await page.locator('[data-testid="search-input"]').fill("GCS");

    await page.waitForTimeout(200);

    const searchResultsHeader = await page.locator(
      '[data-testid="search-results-header"]',
    );
    expect(await searchResultsHeader.isVisible()).toBe(true);
    expect(await searchResultsHeader).toHaveText("Search Results (5)");
    const componentItem = await page.locator('[data-testid="component-item"]');
    expect(componentItem).toHaveCount(5);

    await page.locator('[data-testid="search-input"]').clear();

    await page.waitForTimeout(200);
  });
});
