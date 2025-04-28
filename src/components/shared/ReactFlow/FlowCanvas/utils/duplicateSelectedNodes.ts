import { type Node } from "@xyflow/react";

import type { GraphSpec, TaskSpec } from "@/utils/componentSpec";
import { nodeIdToTaskId } from "@/utils/nodes/nodeIdUtils";
import { setPositionInAnnotations } from "@/utils/nodes/setPositionInAnnotations";
import { getUniqueTaskName } from "@/utils/unique";

const OFFSET = 10;

/* This is bulk duplication of a selection of nodes */
export const duplicateSelectedNodes = (
  graphSpec: GraphSpec,
  nodesToDuplicate: Node[],
) => {
  const newTasks: Record<string, TaskSpec> = {};
  const taskIdMap: Record<string, string> = {};

  // Create new nodes and map old task IDs to new task IDs
  nodesToDuplicate.forEach((node) => {
    const oldTaskId = nodeIdToTaskId(node.id);
    const newTaskId = getUniqueTaskName(graphSpec, oldTaskId);

    if (node.type === "task") {
      taskIdMap[oldTaskId] = newTaskId;

      const taskSpec = graphSpec.tasks[oldTaskId];
      const annotations = taskSpec.annotations || {};

      const updatedAnnotations = setPositionInAnnotations(annotations, {
        x: node.position.x + OFFSET,
        y: node.position.y + OFFSET,
      });

      const newTaskSpec = {
        ...taskSpec,
        annotations: updatedAnnotations,
      };
      newTasks[newTaskId] = newTaskSpec;
    }
  });

  // Update arguments to point to correct duplicated node in the new taskspec
  Object.entries(newTasks).forEach((tasks) => {
    const [taskId, taskSpec] = tasks;

    if (taskSpec.arguments) {
      Object.entries(taskSpec.arguments).forEach(([argKey, argument]) => {
        if (
          typeof argument === "object" &&
          argument !== null &&
          "taskOutput" in argument
        ) {
          const oldTaskId = argument.taskOutput.taskId;

          // Only update the argument if the old task ID is part of the nodes being duplicated
          if (
            nodesToDuplicate.some(
              (node) => nodeIdToTaskId(node.id) === oldTaskId,
            )
          ) {
            const newTaskId = taskIdMap[oldTaskId];

            if (newTaskId && taskSpec.arguments) {
              // Update the taskSpec in the newTasks object
              const updatedTaskSpec = {
                ...(newTasks[taskId] || taskSpec),
                arguments: {
                  ...(newTasks[taskId]?.arguments || taskSpec.arguments),
                  [argKey]: {
                    ...argument,
                    taskOutput: {
                      ...argument.taskOutput,
                      taskId: newTaskId,
                    },
                  },
                },
              };
              newTasks[taskId] = updatedTaskSpec;
            }
          }
        }
      });
    }
  });

  // Update the spec (which will trigger a new render in ReactFlow)
  const updatedTasks = { ...graphSpec.tasks, ...newTasks };
  const updatedGraphSpec = { ...graphSpec, tasks: updatedTasks };

  return { updatedGraphSpec, taskIdMap };
};
