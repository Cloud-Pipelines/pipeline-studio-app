import type { Node } from "@xyflow/react";
import { vi } from "vitest";

import type { TaskNodeData } from "@/types/taskNode";
import type { TaskSpec } from "@/utils/componentSpec";
import { taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";

import { taskSpecFactory } from "./taskSpec";

/**
 * Factory for creating React Flow node test fixtures.
 */
export const nodeFactory = {
  /**
   * Creates a task node with sensible defaults.
   *
   * @example
   * const node = nodeFactory.task("my-task");
   * const node = nodeFactory.task("my-task", {
   *   position: { x: 100, y: 200 },
   *   selected: true,
   *   taskSpec: customTaskSpec
   * });
   */
  task: (
    taskId: string,
    options?: {
      position?: { x: number; y: number };
      selected?: boolean;
      taskSpec?: TaskSpec;
    },
  ): Node<TaskNodeData> => ({
    id: taskIdToNodeId(taskId),
    type: "taskNode",
    position: options?.position || { x: 0, y: 0 },
    selected: options?.selected ?? false,
    data: {
      taskId,
      taskSpec: options?.taskSpec || taskSpecFactory.container(),
      callbacks: mockTaskNodeCallbacksFactory(),
    },
  }),

  /**
   * Creates multiple task nodes.
   *
   * @example
   * const nodes = nodeFactory.tasks(3);
   * // Creates: task1, task2, task3
   */
  tasks: (count: number): Node<TaskNodeData>[] => {
    return Array.from({ length: count }, (_, i) =>
      nodeFactory.task(`task${i + 1}`),
    );
  },

  /**
   * Creates a node with custom data.
   * Useful when you need full control over the node structure.
   */
  custom: <T extends Record<string, unknown> = Record<string, unknown>>(
    id: string,
    data: T,
    options?: {
      type?: string;
      position?: { x: number; y: number };
      selected?: boolean;
    },
  ): Node<T> => ({
    id,
    type: options?.type || "custom",
    position: options?.position || { x: 0, y: 0 },
    selected: options?.selected ?? false,
    data,
  }),
};

/**
 * Creates mock callbacks for task nodes (used in TaskNodeData.callbacks).
 * All callbacks are vi.fn() mocks that can be asserted on.
 *
 * @example
 * const callbacks = mockTaskNodeCallbacksFactory();
 * // Use in tests...
 * expect(callbacks.onDelete).toHaveBeenCalled();
 */
export const mockTaskNodeCallbacksFactory = () => ({
  setArguments: vi.fn(),
  setAnnotations: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onUpgrade: vi.fn(),
});
