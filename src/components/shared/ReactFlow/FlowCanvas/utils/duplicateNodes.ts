import { type Node, type XYPosition } from "@xyflow/react";

import type { TaskOutputArgument } from "@/api/types.gen";
import type { TaskNodeData } from "@/types/taskNode";
import type { GraphSpec, TaskSpec } from "@/utils/componentSpec";
import { createTaskNode } from "@/utils/nodes/createTaskNode";
import { getNodesBounds } from "@/utils/nodes/getNodesBounds";
import { nodeIdToTaskId, taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";
import { setPositionInAnnotations } from "@/utils/nodes/setPositionInAnnotations";
import { getUniqueTaskName } from "@/utils/unique";

const OFFSET = 10;

/* 
  config.connection:
    none = all links between nodes will be removed
    internal = duplicated nodes will maintain links with each other, but not with nodes outside the group
    external = duplicated nodes will maintain links with nodes outside the group, but not with each other
    all = duplicated nodes will maintain all links between nodes within the group and to any nodes with a valid id outside the group
*/
type ConnectionMode = "none" | "internal" | "external" | "all";

export const duplicateNodes = (
  graphSpec: GraphSpec,
  nodesToDuplicate: Node[],
  config?: {
    selected?: boolean;
    position?: XYPosition;
    connection?: ConnectionMode;
    status?: boolean;
  },
) => {
  const newTasks: Record<string, TaskSpec> = {};
  const taskIdMap: Record<string, string> = {};

  // Default Config
  const selected = config?.selected ?? true;
  const connection = config?.connection ?? "all";
  const status = config?.status ?? false;

  /* Create new Nodes and map old Task IDs to new Task IDs */
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

      if (!status) {
        delete updatedAnnotations["status"];
        delete updatedAnnotations["executionId"];
      }

      const newTaskSpec = {
        ...taskSpec,
        annotations: updatedAnnotations,
      };
      newTasks[newTaskId] = newTaskSpec;
    }
  });

  /* Copy over Arguments to the new Tasks */
  Object.entries(newTasks).forEach((tasks) => {
    const [taskId, taskSpec] = tasks;

    if (taskSpec.arguments) {
      Object.entries(taskSpec.arguments).forEach(([argKey, argument]) => {
        const newTaskSpec = newTasks[taskId];

        // Check if the Argument is a connection to another Task (i.e. taskOutput) or a static value
        if (
          typeof argument === "object" &&
          argument !== null &&
          "taskOutput" in argument
        ) {
          newTasks[taskId] = reconfigureConnections(
            newTaskSpec,
            argKey,
            argument as TaskOutputArgument,
            taskIdMap,
            nodesToDuplicate,
            graphSpec,
            connection,
          );
        } else {
          // If the Argument is not a taskOutput, copy it over
          newTasks[taskId] = {
            ...newTaskSpec,
            arguments: {
              ...newTaskSpec.arguments,
              [argKey]: argument,
            },
          };
        }
      });
    }
  });

  /* Update the Graph Spec */
  const updatedTasks = { ...graphSpec.tasks, ...newTasks };
  const updatedGraphSpec = { ...graphSpec, tasks: updatedTasks };

  /* Create new Nodes for the new Tasks */
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

        // Move selection to new node by default
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

  /* Position the new Nodes with layout preserved and centered on the given position */
  if (config?.position) {
    const bounds = getNodesBounds(newNodes);
    const currentCenter = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const offset = {
      x: config.position.x - currentCenter.x,
      y: config.position.y - currentCenter.y,
    };

    // Shift Nodes to the new position
    newNodes.forEach((node) => {
      const newPosition = {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      };

      const taskId = nodeIdToTaskId(node.id);

      if (node.type === "task") {
        const taskSpec = node.data.taskSpec as TaskSpec;
        const annotations = taskSpec.annotations || {};

        const updatedAnnotations = setPositionInAnnotations(
          annotations,
          newPosition,
        );

        const newTaskSpec = {
          ...taskSpec,
          annotations: updatedAnnotations,
        };

        updatedGraphSpec.tasks[taskId] = newTaskSpec;
      }

      node.position = newPosition;
    });
  }

  return { updatedGraphSpec, taskIdMap, newNodes, updatedNodes };
};

function reconfigureConnections(
  taskSpec: TaskSpec,
  argKey: string,
  argument: TaskOutputArgument,
  taskIdMap: Record<string, string>,
  nodes: Node[],
  graphSpec: GraphSpec,
  mode: ConnectionMode,
) {
  const oldTaskId = argument.taskOutput.taskId;
  const oldNodeId = taskIdToNodeId(oldTaskId);
  const newTaskId = taskIdMap[oldTaskId];

  const isInternal = nodes.some((node) => node.id === oldNodeId);
  const isExternal = oldTaskId in graphSpec.tasks;

  switch (mode) {
    case "none":
      // Remove all links
      return removeArgumentFromTaskSpec(taskSpec, argKey);
    case "internal":
      // Maintain links only between duplicated nodes
      return isInternal
        ? updateTaskOutput(taskSpec, argKey, argument, newTaskId)
        : removeArgumentFromTaskSpec(taskSpec, argKey);
    case "external":
      // Maintain links only to original nodes outside the group
      return isExternal && !isInternal
        ? taskSpec
        : removeArgumentFromTaskSpec(taskSpec, argKey);
    case "all":
      // Maintain all links
      if (isInternal) {
        return updateTaskOutput(taskSpec, argKey, argument, newTaskId);
      } else if (isExternal) {
        return taskSpec;
      } else {
        return removeArgumentFromTaskSpec(taskSpec, argKey);
      }
  }
}

function removeArgumentFromTaskSpec(
  taskSpec: TaskSpec,
  argKey: string,
): TaskSpec {
  const updatedTaskSpec = {
    ...taskSpec,
    arguments: Object.fromEntries(
      Object.entries(taskSpec.arguments ?? {}).filter(
        ([key]) => key !== argKey,
      ),
    ),
  };
  return updatedTaskSpec;
}

function updateTaskOutput(
  taskSpec: TaskSpec,
  argKey: string,
  argument: TaskOutputArgument,
  newTaskId: string,
): TaskSpec {
  const updatedTaskSpec = {
    ...taskSpec,
    arguments: {
      ...taskSpec.arguments,
      [argKey]: {
        ...argument,
        taskOutput: {
          ...argument.taskOutput,
          taskId: newTaskId,
        },
      },
    },
  };
  return updatedTaskSpec;
}
