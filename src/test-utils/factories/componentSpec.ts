import type {
  ComponentSpec,
  GraphSpec,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import { taskSpecFactory } from "./taskSpec";

/**
 * Builder pattern for creating ComponentSpec test fixtures.
 * Provides sensible defaults with easy customization.
 *
 * @example
 * const spec = new ComponentSpecBuilder()
 *   .withName("my-component")
 *   .withTask("task1", taskSpecFactory.container())
 *   .build();
 */
export class ComponentSpecBuilder {
  private spec: ComponentSpec;

  constructor() {
    this.spec = {
      name: "test-component",
      implementation: {
        graph: {
          tasks: {},
        },
      },
    };
  }

  withName(name: string): this {
    this.spec.name = name;
    return this;
  }

  withInputs(inputs: InputSpec[]): this {
    this.spec.inputs = inputs;
    return this;
  }

  withOutputs(outputs: OutputSpec[]): this {
    this.spec.outputs = outputs;
    return this;
  }

  withTasks(tasks: Record<string, TaskSpec>): this {
    if (this.spec.implementation && "graph" in this.spec.implementation) {
      this.spec.implementation.graph.tasks = tasks;
    }
    return this;
  }

  withTask(taskId: string, taskSpec: TaskSpec): this {
    if (this.spec.implementation && "graph" in this.spec.implementation) {
      this.spec.implementation.graph.tasks[taskId] = taskSpec;
    }
    return this;
  }

  withGraph(graph: GraphSpec): this {
    this.spec.implementation = { graph };
    return this;
  }

  withOutputValues(outputValues: GraphSpec["outputValues"]): this {
    if (this.spec.implementation && "graph" in this.spec.implementation) {
      this.spec.implementation.graph.outputValues = outputValues;
    }
    return this;
  }

  asContainer(image = "alpine", command: string[] = ["echo", "hello"]): this {
    this.spec.implementation = {
      container: { image, command },
    };
    return this;
  }

  build(): ComponentSpec {
    return this.spec;
  }
}

/**
 * Factory functions for creating ComponentSpec test fixtures.
 * Use these for quick, one-off specs or the builder for more complex scenarios.
 */
export const componentSpecFactory = {
  /**
   * Creates a minimal valid ComponentSpec with a graph implementation.
   */
  build: (overrides?: Partial<ComponentSpec>): ComponentSpec => ({
    name: "test-component",
    implementation: {
      graph: {
        tasks: {},
      },
    },
    ...overrides,
  }),

  /**
   * Creates a ComponentSpec with N container tasks.
   *
   * @example
   * const spec = componentSpecFactory.withTasks(3);
   * // Creates spec with task1, task2, task3
   */
  withTasks: (taskCount: number): ComponentSpec => {
    const tasks = Object.fromEntries(
      Array.from({ length: taskCount }, (_, i) => [
        `task${i + 1}`,
        taskSpecFactory.container(),
      ]),
    );
    return new ComponentSpecBuilder().withTasks(tasks).build();
  },

  /**
   * Creates a deeply nested ComponentSpec structure.
   *
   * @param depth - Number of nesting levels
   * @example
   * const spec = componentSpecFactory.nested(3);
   * // Creates: level-3 > level-2 > level-1
   */
  nested: (depth: number): ComponentSpec => {
    if (depth === 0) {
      return componentSpecFactory.build();
    }

    const nestedTaskSpec = taskSpecFactory.withSpec(
      componentSpecFactory.nested(depth - 1),
    );

    return new ComponentSpecBuilder()
      .withName(`level-${depth}-component`)
      .withTask(`level${depth}-subgraph`, nestedTaskSpec)
      .build();
  },

  /**
   * Creates a ComponentSpec with inputs, outputs, and tasks.
   */
  complete: (options?: {
    name?: string;
    inputCount?: number;
    outputCount?: number;
    taskCount?: number;
  }): ComponentSpec => {
    const {
      name = "complete-component",
      inputCount = 1,
      outputCount = 1,
      taskCount = 2,
    } = options || {};

    const inputs: InputSpec[] = Array.from({ length: inputCount }, (_, i) => ({
      name: `input${i + 1}`,
      type: "String",
    }));

    const outputs: OutputSpec[] = Array.from(
      { length: outputCount },
      (_, i) => ({
        name: `output${i + 1}`,
        type: "String",
      }),
    );

    const tasks = Object.fromEntries(
      Array.from({ length: taskCount }, (_, i) => [
        `task${i + 1}`,
        taskSpecFactory.container(),
      ]),
    );

    return new ComponentSpecBuilder()
      .withName(name)
      .withInputs(inputs)
      .withOutputs(outputs)
      .withTasks(tasks)
      .build();
  },
};
