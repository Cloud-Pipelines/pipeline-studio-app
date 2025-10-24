# Test Utilities

This package provides factories and utilities for creating test fixtures, making tests more readable and maintainable.

## Quick Start

```typescript
import { componentSpecFactory, taskSpecFactory, fixtures } from "@/test-utils";

// Create a simple component
const spec = componentSpecFactory.build();

// Create a component with tasks
const spec = componentSpecFactory.withTasks(3);

// Use the builder for more control
const spec = new ComponentSpecBuilder()
  .withName("my-component")
  .withTask("task1", taskSpecFactory.container())
  .withTask("subgraph", taskSpecFactory.graph(2))
  .build();
```

## Factories

### ComponentSpec Factory

**Functional API:**

```typescript
// Minimal component
const spec = componentSpecFactory.build();

// Component with N tasks
const spec = componentSpecFactory.withTasks(5);

// Deeply nested component
const spec = componentSpecFactory.nested(3);
// Creates: level-3 > level-2 > level-1

// Complete component with inputs/outputs
const spec = componentSpecFactory.complete({
  name: "my-component",
  inputCount: 2,
  outputCount: 1,
  taskCount: 3,
});
```

**Builder API:**

```typescript
const spec = new ComponentSpecBuilder()
  .withName("custom-component")
  .withInputs([{ name: "input1", type: "String" }])
  .withOutputs([{ name: "output1", type: "String" }])
  .withTask("task1", taskSpecFactory.container())
  .withTask("subgraph1", taskSpecFactory.graph(2))
  .build();
```

### TaskSpec Factory

```typescript
// Container task
const task = taskSpecFactory.container();
const task = taskSpecFactory.container("python:3.9", ["python", "script.py"]);

// Graph task with N child tasks
const task = taskSpecFactory.graph(3);

// Graph task with specific children
const task = taskSpecFactory.graph({
  myTask: taskSpecFactory.container(),
  mySubgraph: taskSpecFactory.graph(2),
});

// Task with a specific ComponentSpec
const task = taskSpecFactory.withSpec(componentSpec);

// Task with arguments
const task = taskSpecFactory.withArguments({
  param1: "value1",
  param2: { graphInput: { inputName: "input1" } },
});

// Task at a specific position
const task = taskSpecFactory.atPosition(100, 200);

// Minimal task (just componentRef)
const task = taskSpecFactory.minimal();
```

### Node Factory

```typescript
// Simple task node
const node = nodeFactory.task("my-task");

// Task node with options
const node = nodeFactory.task("my-task", {
  position: { x: 100, y: 200 },
  selected: true,
  taskSpec: customTaskSpec,
});

// Multiple task nodes
const nodes = nodeFactory.tasks(5);
// Creates: task1, task2, task3, task4, task5
```

### Fixtures

Common constants to avoid magic strings/numbers:

```typescript
import { fixtures } from "@/test-utils";

// Positions
fixtures.positions.origin; // { x: 0, y: 0 }
fixtures.positions.centered; // { x: 100, y: 100 }
fixtures.positions.at(50, 75); // { x: 50, y: 75 }

// IDs
fixtures.ids.task(1); // "task1"
fixtures.ids.input(2); // "input2"

// Paths
fixtures.paths.root; // ["root"]
fixtures.paths.shallow("task1"); // ["root", "task1"]
fixtures.paths.deep("task1", "task2", "task3"); // ["root", "task1", "task2", "task3"]

// Names
fixtures.names.component; // "test-component"
fixtures.names.task; // "test-task"

// Images
fixtures.images.python; // "python:3.9"
```

## Migration Guide

### Before

```typescript
describe("myFunction", () => {
  const createComponentSpec = () => ({
    name: "test-component",
    implementation: {
      graph: {
        tasks: {
          task1: {
            componentRef: {
              spec: {
                implementation: {
                  container: {
                    image: "alpine",
                    command: ["echo", "hello"],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  it("should work", () => {
    const spec = createComponentSpec();
    // test logic...
  });
});
```

### After

```typescript
import { componentSpecFactory, taskSpecFactory } from "@/test-utils";

describe("myFunction", () => {
  it("should work", () => {
    const spec = new ComponentSpecBuilder()
      .withName("test-component")
      .withTask("task1", taskSpecFactory.container())
      .build();
    // test logic...
  });
});
```

## Best Practices

1. **Use factories for setup** - They're more maintainable than inline objects
2. **Use fixtures for constants** - Avoid magic strings/numbers
3. **Use the builder for complex specs** - For simple ones, use the functional API
4. **Compose factories** - Build complex structures from simple pieces

```typescript
// ✅ Good: Composable and readable
const spec = new ComponentSpecBuilder()
  .withName("pipeline")
  .withTask("preprocess", taskSpecFactory.graph(2))
  .withTask("train", taskSpecFactory.container("python:3.9"))
  .withTask("evaluate", taskSpecFactory.container())
  .build();

// ❌ Avoid: Inline objects are hard to maintain
const spec = {
  name: "pipeline",
  implementation: {
    graph: {
      tasks: {
        // 50 lines of nested objects...
      },
    },
  },
};
```

## Examples

See `src/utils/subgraphUtils.test.ts` for a complete example of migrated tests.
