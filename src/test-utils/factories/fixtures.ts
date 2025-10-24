/**
 * Common test fixtures and constants.
 * Use these to avoid magic numbers and strings in tests.
 */
export const fixtures = {
  /**
   * Common position coordinates.
   */
  positions: {
    origin: { x: 0, y: 0 },
    centered: { x: 100, y: 100 },
    topLeft: { x: 50, y: 50 },
    bottomRight: { x: 300, y: 300 },
    /**
     * Create a custom position.
     */
    at: (x: number, y: number) => ({ x, y }),
  },

  /**
   * Common ID generators.
   */
  ids: {
    task: (n: number) => `task${n}`,
    input: (n: number) => `input${n}`,
    output: (n: number) => `output${n}`,
    subgraph: (n: number) => `subgraph${n}`,
  },

  /**
   * Subgraph path builders.
   */
  paths: {
    /**
     * Root path: ["root"]
     */
    root: ["root"],
    /**
     * Shallow path: ["root", taskId]
     */
    shallow: (taskId: string) => ["root", taskId],
    /**
     * Deep path: ["root", ...taskIds]
     * @example
     * fixtures.paths.deep("task1", "task2", "task3")
     * // ["root", "task1", "task2", "task3"]
     */
    deep: (...taskIds: string[]) => ["root", ...taskIds],
  },

  /**
   * Common task names.
   */
  names: {
    component: "test-component",
    task: "test-task",
    input: "test-input",
    output: "test-output",
  },

  /**
   * Common container images.
   */
  images: {
    alpine: "alpine",
    python: "python:3.9",
    node: "node:18",
  },
};
