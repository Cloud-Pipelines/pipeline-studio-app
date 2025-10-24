/**
 * Test utilities and factories for creating test fixtures.
 *
 * This package provides:
 * - Factories for creating ComponentSpec, TaskSpec, and React Flow nodes
 * - Common test fixtures (positions, IDs, paths)
 * - Re-exports of vitest utilities
 *
 * @example
 * import { componentSpecFactory, taskSpecFactory, fixtures } from "@/test-utils";
 *
 * const spec = componentSpecFactory
 *   .build()
 *   .withTask("task1", taskSpecFactory.container())
 *   .build();
 */

// Factory exports
export {
  ComponentSpecBuilder,
  componentSpecFactory,
} from "./factories/componentSpec";
export { fixtures } from "./factories/fixtures";
export { mockTaskNodeCallbacksFactory, nodeFactory } from "./factories/nodes";
export { taskSpecFactory } from "./factories/taskSpec";

// Re-export commonly used vitest utilities for convenience
export { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
