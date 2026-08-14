# Playwright Test Helpers Guide

## Overview

The Pipeline Studio app provides a comprehensive set of helper functions in `tests/e2e/helpers.ts` to make writing E2E tests easier and more maintainable. These helpers are specifically designed for testing React Flow-based pipeline editors.

## Core Helper Categories

### 1. Pipeline Setup Helpers

#### `createNewPipeline(page: Page)`

Creates a new pipeline by navigating to home and clicking the new pipeline button.

```typescript
await createNewPipeline(page);
```

### 2. Canvas Interaction Helpers

#### Canvas Locators

- `locateFlowCanvas(page)` - Main React Flow wrapper
- `locateFlowViewport(page)` - React Flow viewport
- `locateFlowPane(page)` - Clickable canvas area

#### Canvas Actions

- `clickOnCanvas(page, x, y)` - click at coordinates (defaults `x=400`, `y=300`)
- `panCanvas(page, deltaX, deltaY)` - pan the canvas (defaults `deltaX=50`, `deltaY=50`)
- `zoomIn(page)`, `zoomOut(page)`, `fitToView(page)` - zoom controls

```typescript
await clickOnCanvas(page, 400, 300);
await panCanvas(page, deltaX, deltaY);
await zoomIn(page);
await zoomOut(page);
await fitToView(page);
```

### 3. Component Library Helpers

#### Working with Component Folders

`dropComponentFromLibraryOnCanvas` does the whole open-locate-drag workflow in one call; its fourth
argument is optional.

```typescript
const folder = await openComponentLibFolder(page, "Quick start");
const component = locateComponentInFolder(folder, "Chicago Taxi Trips dataset");

const node = await dropComponentFromLibraryOnCanvas(
  page,
  "Quick start",
  "Chicago Taxi Trips dataset",
  { targetPosition: { x: 400, y: 300 } },
);
```

### 4. Node Interaction Helpers

#### Node Selection and Manipulation

```typescript
const node = locateNodeByName(page, "Chicago Taxi Trips dataset");

await node.click();
await expect(node).toHaveClass(/\bselected\b/);
```

### 5. Context Panel Helpers

#### Working with Side Panels

```typescript
await waitForContextPanel(page, "pipeline-details");
await waitForContextPanel(page, "task-overview");

const container = locateContextPanelContainer(page);
const panel = locateContextPanel(page, "pipeline-details");
```

## Complete Test Examples

### Basic Canvas Test

```typescript
test("should load pipeline editor and allow basic interaction", async ({
  page,
}) => {
  await createNewPipeline(page);

  await expect(locateFlowCanvas(page)).toBeVisible();
  await expect(locateFlowViewport(page)).toBeVisible();
  await expect(page.locator(".react-flow__minimap")).toBeVisible();
  await expect(page.locator(".react-flow__background")).toBeVisible();
  await expect(page.locator(".react-flow__controls")).toBeVisible();

  await clickOnCanvas(page, 400, 300);
  await panCanvas(page, 50, 50);
  await zoomIn(page);
  await zoomOut(page);
});
```

### Component Placement Test

```typescript
test("should place and select nodes", async ({ page }) => {
  await createNewPipeline(page);

  const node = await dropComponentFromLibraryOnCanvas(
    page,
    "Quick start",
    "Chicago Taxi Trips dataset",
  );

  await expect(node).toBeVisible();
  await waitForContextPanel(page, "pipeline-details");

  await node.click();
  await expect(node).toHaveClass(/\bselected\b/);
  await waitForContextPanel(page, "task-overview");
});
```

### Node Connection Test

```typescript
test("should connect two nodes", async ({ page }) => {
  await createNewPipeline(page);

  const nodeA = await dropComponentFromLibraryOnCanvas(
    page,
    "Quick start",
    "Chicago Taxi Trips dataset",
  );

  const nodeABox = await nodeA.boundingBox();
  await panCanvas(page, -nodeABox!.width, 0);

  const nodeB = await dropComponentFromLibraryOnCanvas(
    page,
    "Quick start",
    "Train XGBoost model on CSV",
    { targetPosition: { x: nodeABox!.width * 1.5, y: nodeABox!.y } },
  );

  await expect(nodeA).toBeVisible();
  await expect(nodeB).toBeVisible();

  const outputPin = nodeA.locator('[data-handleid="output_Table"]');
  const inputPin = nodeB.locator('[data-handleid="input_training_data"]');

  // A drag only registers when both pins are inside the viewport.
  await fitToView(page);

  await expect(outputPin).toBeInViewport();
  await expect(inputPin).toBeInViewport();
  // bg-red-700 marks a required input that is not yet connected.
  await expect(inputPin).toHaveClass(/\bbg-red-700\b/);

  await outputPin.hover();
  await page.mouse.down();
  await inputPin.hover();
  await page.mouse.up();

  await expect(inputPin).not.toHaveClass(/\bbg-red-700\b/);
  await expect(inputPin).toHaveClass(/\bbg-gray-500\b/);

  const edgesContainer = page.locator(".react-flow__edges");
  const edge = edgesContainer.locator(
    '[data-testid="rf__edge-Chicago Taxi Trips dataset_Table-Train XGBoost model on CSV_training_data"]',
  );
  await expect(edge).toBeVisible();

  const inputHandle = nodeB.locator(
    '[data-testid="input-handle-training_data"]',
  );
  await expect(inputHandle).toBeVisible();

  await expect(
    inputHandle.locator('[data-testid="input-handle-value-training_data"]'),
  ).toHaveText(`{
  "taskOutput": {
    "taskId": "Chicago Taxi Trips dataset",
    "outputName": "Table"
  }
}`);
});
```

## Key Selectors Reference

### React Flow Elements

- `.reactflow-wrapper` - Main container
- `[data-testid="rf__wrapper"]` - React Flow wrapper
- `.react-flow__viewport` - Canvas viewport
- `.react-flow__pane` - Clickable canvas area
- `.react-flow__minimap` - MiniMap component
- `.react-flow__background` - Background grid
- `.react-flow__controls` - Zoom/fit controls
- `.react-flow__controls-zoomin` - Zoom in button
- `.react-flow__controls-zoomout` - Zoom out button
- `.react-flow__controls-fitview` - Fit to view button
- `.react-flow__edges` - Edge container

### Custom App Elements

- `[data-testid="new-pipeline-button"]` - New pipeline button
- `[data-testid="rf__node-task_{nodeName}"]` - Task nodes
- `[data-folder-name="{folderName}"]` - Component library folders
- `[data-testid="context-panel-container"]` - Context panel container
- `[data-context-panel="{panelName}"]` - Specific context panels
- `[data-handleid="{handleId}"]` - Node connection handles
- `[data-testid="input-handle-{inputName}"]` - Input handles
- `[data-testid="input-handle-value-{inputName}"]` - Input handle values

### Handle and Connection Selectors

Edge test ids follow the format `source_output-target_input`.

```typescript
const outputPin = node.locator('[data-handleid="output_Table"]');
const inputPin = node.locator('[data-handleid="input_training_data"]');
const inputHandle = node.locator('[data-testid="input-handle-training_data"]');

const edge = page.locator(
  '[data-testid="rf__edge-Chicago Taxi Trips dataset_Table-Train XGBoost model on CSV_training_data"]',
);
```

## Best Practices

### 1. Setup and Initialization

- Always use `createNewPipeline(page)` to start tests
- Wait for canvas to load: `await page.waitForSelector(".reactflow-wrapper", { timeout: 10000 })`

### 2. Viewport Management

- Use `fitToView()` before complex interactions to ensure elements are visible
- Check elements are in viewport: `await expect(element).toBeInViewport()`
- Get bounding boxes for positioning: `await node.boundingBox()`

### 3. Node Positioning

Read the existing node's box, pan to make room, then position the new node relative to it.

```typescript
const nodeBox = await node.boundingBox();
await panCanvas(page, -nodeBox!.width, 0);

const newNode = await dropComponentFromLibraryOnCanvas(
  page,
  "Quick start",
  "Component Name",
  { targetPosition: { x: nodeBox!.width * 1.5, y: nodeBox!.y } },
);
```

### 4. Connection Testing

Always assert the connection state both before and after connecting. The state lives in the pin's
class: `bg-red-700` means required-but-unconnected, `bg-gray-500` means connected.

```typescript
await expect(inputPin).toHaveClass(/\bbg-red-700\b/);
// ... perform connection ...
await expect(inputPin).toHaveClass(/\bbg-gray-500\b/);
```

### 5. Async Operations

- Always await helper functions
- Use proper waiting strategies for dynamic content
- Verify state changes with `expect()` assertions after interactions

### 6. Test Structure

- Use descriptive test names that focus on single, specific behaviors
- Group related tests in `test.describe()` blocks
- Include setup, action, and verification phases

### 7. Debugging

`page.pause()` opens the inspector for interactive debugging, and logging a bounding box helps with
positioning problems.

```typescript
await page.pause();

const nodeBox = await node.boundingBox();
console.log("Node position:", nodeBox);
```

## Known Limitations & TODOs

### Current Limitations

- **Node positioning**: The helpers note a need for more reliable relative positioning accounting for canvas transform
- **Canvas panning**: Current pan implementation tries to avoid nodes but could be more reliable
- **Viewport management**: Some operations require manual viewport management with `fitToView()`

### Planned Improvements

From the helpers file comments:

```typescript
// todo: helper to position node relatively to another node accounting for the Canvas transform
// todo: figure out more reliable way to pan
// todo: create more reliable way to position nodes
```

## Running Tests

### Command Line Options

```bash
# Run all E2E tests (headless)
pnpm run test:e2e

# Run with UI (for debugging)
pnpm run test:e2e:ui

# Run in headed mode (see the browser)
pnpm run test:e2e:headed
```

### Test Files

- `tests/e2e/flowcanvas.spec.ts` - Main functionality tests
- `tests/e2e/debug.spec.ts` - Debug and experimental tests
- `tests/e2e/helpers.ts` - Helper functions
- `tests/e2e/helpers/flowCanvas.ts` - Additional flow-specific helpers (currently empty)

## Helper Function Reference

### Complete Function Signatures

#### Setup

```typescript
export async function createNewPipeline(page: Page): Promise<void>;
```

#### Canvas locators

```typescript
export function locateFlowCanvas(page: Page): Locator;
export function locateFlowViewport(page: Page): Locator;
export function locateFlowPane(page: Page): Locator;
```

#### Canvas interactions

```typescript
export async function clickOnCanvas(
  page: Page,
  x: number = 400,
  y: number = 300,
): Promise<void>;
export async function panCanvas(
  page: Page,
  deltaX: number = 50,
  deltaY: number = 50,
): Promise<void>;
export async function zoomIn(page: Page): Promise<void>;
export async function zoomOut(page: Page): Promise<void>;
export async function fitToView(page: Page): Promise<void>;
```

#### Component library

```typescript
export async function openComponentLibFolder(
  page: Page,
  folderName: string,
): Promise<Locator>;
export function locateComponentInFolder(
  folder: Locator,
  componentName: string,
): Locator;
export async function dragComponentToCanvas(
  page: Page,
  component: Locator,
  dragOptions: DragOptions = {},
): Promise<void>;
```

#### Nodes

```typescript
export function locateNodeByName(page: Page, nodeName: string): Locator;
```

#### Context panels

```typescript
export function locateContextPanelContainer(page: Page): Locator;
export function locateContextPanel(page: Page, panelName: string): Locator;
export async function waitForContextPanel(
  page: Page,
  panelName: string,
): Promise<Locator>;
```

#### Complete workflows

```typescript
export async function dropComponentFromLibraryOnCanvas(
  page: Page,
  folderName: string,
  componentName: string,
  dragOptions: DragOptions = {},
): Promise<Locator>;
```

This helper library provides a solid foundation for testing React Flow-based pipeline editors, with room for expansion as more complex test scenarios are needed.
