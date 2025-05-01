import { type Node } from "@xyflow/react";

import type { TaskNodeData } from "@/types/taskNode";
import type { GraphSpec, TaskSpec } from "@/utils/componentSpec";
import { createTaskNode } from "@/utils/nodes/createTaskNode";
import { nodeIdToTaskId } from "@/utils/nodes/nodeIdUtils";
import { setPositionInAnnotations } from "@/utils/nodes/setPositionInAnnotations";
import { getUniqueTaskName } from "@/utils/unique";

const OFFSET = 10;

/* This is bulk duplication of a selection of nodes */
export const duplicateNodes = (
  graphSpec: GraphSpec,
  nodesToDuplicate: Node[],
  selected: boolean,
) => {
  const newTasks: Record<string, TaskSpec> = {};
  const taskIdMap: Record<string, string> = {};

  // Create new nodes and map old task IDs to new task IDs
  nodesToDuplicate.forEach((node) => {
    const oldTaskId = nodeIdToTaskId(node.id);
    const newTaskId = getUniqueTaskName(graphSpec, oldTaskId);

    if (node.type === "task") {
      taskIdMap[oldTaskId] = newTaskId;

      const taskSpec = node.data.taskSpec as TaskSpec;
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

  // Update the spec
  const updatedTasks = { ...graphSpec.tasks, ...newTasks };
  const updatedGraphSpec = { ...graphSpec, tasks: updatedTasks };

  // Create new nodes for the new tasks
  const updatedNodes: Node[] = [];

  const newNodes = Object.entries(taskIdMap)
    .map(([oldTaskId, newTaskId]) => {
      const originalNode = nodesToDuplicate.find(
        (node) => nodeIdToTaskId(node.id) === oldTaskId,
      );

      if (originalNode) {
        const originalNodeData = originalNode.data as TaskNodeData;

        const newNode = createTaskNode(
          [newTaskId, updatedGraphSpec.tasks[newTaskId]],
          originalNodeData,
        );

        if (selected) {
          originalNode.selected = false;
          newNode.selected = true;
        }

        newNode.measured = originalNode.measured;

        updatedNodes.push(originalNode);

        return newNode;
      }
    })
    .filter(Boolean) as Node[];

  return { updatedGraphSpec, taskIdMap, newNodes, updatedNodes };
};
