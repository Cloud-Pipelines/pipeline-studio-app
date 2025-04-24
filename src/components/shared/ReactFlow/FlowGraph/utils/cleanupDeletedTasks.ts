import { type Node } from "@xyflow/react";

import type { ComponentSpec } from "@/utils/componentSpec";

export const cleanupDeletedTasks = (
  componentSpec: ComponentSpec,
  deletedNodes: Node[]
) => {
  const updatedComponentSpec = { ...componentSpec };

  if (!("graph" in updatedComponentSpec.implementation)) {
    console.error("No graph implementation found in component spec");
    return componentSpec;
  }

  const nodesToDeleteIds = deletedNodes
    .map((node) =>
      node.id.startsWith("task_") ? node.id.replace("task_", "") : ""
    )
    .filter((id) => id); // Get all task IDs to delete and filter out empty strings

  const updatedGraphSpec = { ...updatedComponentSpec.implementation.graph };

  const cleanedTasks = { ...updatedGraphSpec.tasks };
  for (const taskId in cleanedTasks) {
    const taskSpec = cleanedTasks[taskId];

    // Skip if this task has no arguments
    if (!taskSpec.arguments) continue;

    // Create a new arguments object without references to deleted tasks
    const newArguments = { ...taskSpec.arguments };
    let argumentsChanged = false;

    // Check each argument for references to deleted tasks
    for (const [argName, argValue] of Object.entries(newArguments)) {
      if (typeof argValue !== "string" && "taskOutput" in argValue) {
        // If this argument references a task that's being deleted, remove it
        if (nodesToDeleteIds.includes(argValue.taskOutput.taskId)) {
          delete newArguments[argName];
          argumentsChanged = true;
        }
      }
    }

    // If we changed arguments, update the task
    if (argumentsChanged) {
      cleanedTasks[taskId] = {
        ...taskSpec,
        arguments: newArguments,
      };
    }
  }

  // Create the final graph spec with cleaned tasks
  const newGraphSpec = {
    ...updatedGraphSpec,
    tasks: Object.fromEntries(
      Object.entries(cleanedTasks).filter(
        ([taskId]) => !nodesToDeleteIds.includes(taskId)
      )
    ),
  };

  updatedComponentSpec.implementation.graph = newGraphSpec;

  return updatedComponentSpec;
};
