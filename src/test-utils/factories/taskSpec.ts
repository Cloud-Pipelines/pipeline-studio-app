import type { ComponentSpec, TaskSpec } from "@/utils/componentSpec";

/**
 * Factory functions for creating TaskSpec test fixtures.
 * These are the building blocks for creating ComponentSpec structures.
 */
export const taskSpecFactory = {
  /**
   * Creates a container task spec.
   *
   * @example
   * const task = taskSpecFactory.container();
   * const task = taskSpecFactory.container("python:3.9", ["python", "script.py"]);
   */
  container: (
    image = "alpine",
    command: string[] = ["echo", "hello"],
  ): TaskSpec => ({
    componentRef: {
      spec: {
        implementation: {
          container: { image, command },
        },
      },
    },
  }),

  /**
   * Creates a graph task with child tasks.
   *
   * @param tasks - Either a number (creates N container tasks) or a task map
   * @example
   * const task = taskSpecFactory.graph(3); // Creates task1, task2, task3
   * const task = taskSpecFactory.graph({ myTask: taskSpecFactory.container() });
   */
  graph: (tasks?: Record<string, TaskSpec> | number): TaskSpec => {
    const taskMap =
      typeof tasks === "number"
        ? Object.fromEntries(
            Array.from({ length: tasks }, (_, i) => [
              `task${i + 1}`,
              taskSpecFactory.container(),
            ]),
          )
        : tasks || {};

    return {
      componentRef: {
        spec: {
          name: "test-graph-component",
          implementation: {
            graph: {
              tasks: taskMap,
            },
          },
        },
      },
    };
  },

  /**
   * Creates a task with a specific ComponentSpec.
   * Useful for creating nested subgraphs.
   *
   * @example
   * const nestedSpec = componentSpecFactory.build();
   * const task = taskSpecFactory.withSpec(nestedSpec);
   */
  withSpec: (spec: ComponentSpec): TaskSpec => ({
    componentRef: { spec },
  }),

  /**
   * Creates a task with specific arguments.
   *
   * @example
   * const task = taskSpecFactory.withArguments({
   *   param1: "value1",
   *   param2: { graphInput: { inputName: "input1" } }
   * });
   */
  withArguments: (args: Record<string, unknown>): TaskSpec => ({
    componentRef: {},
    arguments: args as Record<string, never>,
  }),

  /**
   * Creates a task with annotations.
   *
   * @example
   * const task = taskSpecFactory.withAnnotations({
   *   "my.custom.annotation": "value"
   * });
   */
  withAnnotations: (annotations: Record<string, string>): TaskSpec => ({
    componentRef: {},
    annotations,
  }),

  /**
   * Creates a task at a specific editor position.
   *
   * @example
   * const task = taskSpecFactory.atPosition(100, 200);
   */
  atPosition: (x: number, y: number): TaskSpec => ({
    componentRef: {},
    annotations: {
      "editor.position": JSON.stringify({ x, y }),
    },
  }),

  /**
   * Creates a minimal task spec (just componentRef).
   * Useful when you need a placeholder.
   */
  minimal: (): TaskSpec => ({
    componentRef: {},
  }),
};
