/**
 * Utility functions for converting between node IDs and their corresponding names/identifiers
 */

/**
 * Extracts the task ID from a task node ID by removing the "task_" prefix
 */
export const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");

/**
 * Extracts the input name from an input node ID by removing the "input_" prefix
 */
export const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");

/**
 * Extracts the output name from an output node ID by removing the "output_" prefix
 */
export const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

/**
 * Creates a task node ID by adding the "task_" prefix to a task ID
 */
export const taskIdToNodeId = (taskId: string) => `task_${taskId}`;

/**
 * Creates an input node ID by adding the "input_" prefix to an input name
 */
export const inputNameToNodeId = (inputName: string) => `input_${inputName}`;

/**
 * Creates an output node ID by adding the "output_" prefix to an output name
 */
export const outputNameToNodeId = (outputName: string) =>
  `output_${outputName}`;
