import { type Node, type XYPosition } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import {
  isInputNode,
  isOutputNode,
  isTaskNode,
  type NodeData,
} from "@/types/nodes";
import {
  type ComponentSpec,
  type GraphInputArgument,
  type InputSpec,
  isGraphImplementation,
  type OutputSpec,
  type TaskOutputArgument,
  type TaskSpec,
} from "@/utils/componentSpec";
import { createInputNode } from "@/utils/nodes/createInputNode";
import { createOutputNode } from "@/utils/nodes/createOutputNode";
import { createTaskNode } from "@/utils/nodes/createTaskNode";
import { getNodesBounds } from "@/utils/nodes/getNodesBounds";
import { setPositionInAnnotations } from "@/utils/nodes/setPositionInAnnotations";
import { convertTaskCallbacksToNodeCallbacks } from "@/utils/nodes/taskCallbackUtils";
import {
  getUniqueInputName,
  getUniqueOutputName,
  getUniqueTaskId,
} from "@/utils/unique";

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
  componentSpec: ComponentSpec,
  nodesToDuplicate: Node[],
  nodeManager: NodeManager,
  config?: {
    selected?: boolean;
    position?: XYPosition;
    connection?: ConnectionMode;
    status?: boolean;
  },
) => {
  if (!isGraphImplementation(componentSpec.implementation)) {
    throw new Error("ComponentSpec does not contain a graph implementation.");
  }

  const graphSpec = componentSpec.implementation.graph;

  const nodeIdMap: Record<string, string> = {};
  const newTasks: Record<string, TaskSpec> = {};
  const newInputs: Record<string, InputSpec> = {};
  const newOutputs: Record<string, OutputSpec> = {};

  // Default Config
  const selected = config?.selected ?? true;
  const connection = config?.connection ?? "all";

  // Temporary specs used to ensure newly generated names & ids are truly unique
  const tempGraphSpec = { ...graphSpec };
  const tempComponentSpec = { ...componentSpec };

  /* Create new Nodes and map old Task IDs to new Task IDs */
  nodesToDuplicate.forEach((node) => {
    const oldNodeId = node.id;

    if (isTaskNode(node)) {
      const oldTaskId = node.data.taskId;
      const newTaskId = getUniqueTaskId(tempGraphSpec, oldTaskId);
      const newNodeId = nodeManager.getNodeId(newTaskId, "task");

      nodeIdMap[oldNodeId] = newNodeId;

      const taskSpec = node.data.taskSpec;
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
      tempGraphSpec.tasks = {
        ...tempGraphSpec.tasks,
        [newTaskId]: newTaskSpec,
      };
    } else if (isInputNode(node)) {
      const inputSpec = node.data.spec;

      const newInputName = getUniqueInputName(
        tempComponentSpec,
        inputSpec.name,
      );
      const newNodeId = nodeManager.getNodeId(newInputName, "input");

      nodeIdMap[oldNodeId] = newNodeId;

      const annotations = inputSpec.annotations || {};

      const updatedAnnotations = setPositionInAnnotations(annotations, {
        x: node.position.x + OFFSET,
        y: node.position.y + OFFSET,
      });

      const newInputSpec = {
        ...inputSpec,
        name: newInputName,
        annotations: updatedAnnotations,
      };

      newInputs[newInputName] = newInputSpec;
      tempComponentSpec.inputs = [
        ...(tempComponentSpec.inputs || []),
        newInputSpec,
      ];
    } else if (isOutputNode(node)) {
      const outputSpec = node.data.spec;

      const newOutputName = getUniqueOutputName(
        tempComponentSpec,
        outputSpec.name,
      );
      const newNodeId = nodeManager.getNodeId(newOutputName, "output");

      nodeIdMap[oldNodeId] = newNodeId;

      const annotations = outputSpec.annotations || {};

      const updatedAnnotations = setPositionInAnnotations(annotations, {
        x: node.position.x + OFFSET,
        y: node.position.y + OFFSET,
      });

      const newOutputSpec = {
        ...outputSpec,
        name: newOutputName,
        annotations: updatedAnnotations,
      };

      newOutputs[newOutputName] = newOutputSpec;
      tempComponentSpec.outputs = [
        ...(tempComponentSpec.outputs || []),
        newOutputSpec,
      ];
    }
  });

  /* Copy over Arguments to the new Tasks */
  Object.entries(newTasks).forEach((tasks) => {
    const [taskId, taskSpec] = tasks;

    if (taskSpec.arguments) {
      Object.entries(taskSpec.arguments).forEach(([argKey, argument]) => {
        const newTaskSpec = newTasks[taskId];

        // Check if the Argument is a connection to another Task or Input Node (i.e. TaskOutput or GraphInput) or a static value
        if (
          typeof argument === "object" &&
          argument !== null &&
          ("taskOutput" in argument || "graphInput" in argument)
        ) {
          newTasks[taskId] = reconfigureConnections(
            newTaskSpec,
            argKey,
            argument,
            nodeIdMap,
            nodesToDuplicate,
            componentSpec,
            connection,
            nodeManager,
          );
        } else {
          // If the Argument is not a TaskOutput or GraphInput, copy it over
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

  const updatedGraphOutputs = { ...graphSpec.outputValues };

  // Output Nodes can only have one input, so the "external" connection mode does not apply to them.
  if (connection !== "none" && connection !== "external") {
    /* Reconfigure Output Nodes */
    Object.entries(newOutputs).forEach((output) => {
      const [outputName] = output;
      const newNodeId = nodeManager.getNodeId(outputName, "output");
      const oldNodeId = Object.keys(nodeIdMap).find(
        (key) => nodeIdMap[key] === newNodeId,
      );

      if (!oldNodeId) {
        return;
      }

      const originalOutputNode = nodesToDuplicate.find(
        (node) => node.id === oldNodeId && isOutputNode(node),
      );

      if (!originalOutputNode || !isOutputNode(originalOutputNode)) {
        return;
      }

      const oldOutputName = originalOutputNode.data.spec.name;

      const originalOutputValue = graphSpec.outputValues?.[oldOutputName];

      if (!originalOutputValue) {
        // Todo: Handle cross-instance copy + paste for output nodes (we don't have the original graphSpec available so we can't look up the output value)
        console.warn(
          `No output value found for output ${oldOutputName} in graph spec.`,
        );
        return;
      }

      if (!("taskOutput" in originalOutputValue)) {
        console.warn(
          `Output ${oldOutputName} is not connected to a task output`,
        );
        return;
      }

      const connectedTaskId = originalOutputValue.taskOutput.taskId;
      const connectedOutputName = originalOutputValue.taskOutput.outputName;

      const originalNodeId = nodeManager.getNodeId(connectedTaskId, "task");

      const newTaskNodeId = nodeIdMap[originalNodeId];
      if (!newTaskNodeId) {
        console.warn(`No mapping found for task node ${originalNodeId}`);
        return;
      }

      const newTaskId = nodeManager.getRefId(newTaskNodeId);
      if (!newTaskId) {
        console.warn(`Could not get new task ID for node ${newTaskNodeId}`);
        return;
      }

      const outputValue: TaskOutputArgument = {
        taskOutput: {
          taskId: newTaskId,
          outputName: connectedOutputName,
        },
      };

      updatedGraphOutputs[outputName] = outputValue;
    });
  }

  /* Update the Graph Spec */
  const updatedTasks = { ...graphSpec.tasks, ...newTasks };
  const updatedGraphSpec = {
    ...graphSpec,
    tasks: updatedTasks,
    outputValues: updatedGraphOutputs,
  };

  const updatedInputs = [
    ...(componentSpec.inputs ?? []),
    ...Object.values(newInputs),
  ];

  const updatedOutputs = [
    ...(componentSpec.outputs ?? []),
    ...Object.values(newOutputs),
  ];

  /* Create new Nodes for the new Tasks */
  const updatedNodes: Node[] = [];

  const newNodes = Object.entries(nodeIdMap)
    .map(([oldNodeId, newNodeId]) => {
      const originalNode = nodesToDuplicate.find(
        (node) => node.id === oldNodeId,
      );
      if (!originalNode) {
        return null;
      }

      const newId = nodeManager.getRefId(newNodeId);

      if (!newId) {
        return null;
      }

      if (isTaskNode(originalNode)) {
        const newTaskSpec = updatedGraphSpec.tasks[newId];

        const nodeData: NodeData = {
          readOnly: originalNode.data.readOnly,
          connectable: originalNode.data.connectable,
          callbacks: convertTaskCallbacksToNodeCallbacks(
            originalNode.data.callbacks,
          ),
          nodeManager,
        };

        const newNode = createTaskNode([newId, newTaskSpec], nodeData);

        newNode.id = newNodeId;
        newNode.selected = false;

        // Move selection to new node by default
        if (selected) {
          originalNode.selected = false;
          newNode.selected = true;
        }

        newNode.measured = originalNode.measured;

        updatedNodes.push(originalNode);

        return newNode;
      } else if (isInputNode(originalNode)) {
        const newInputSpec = updatedInputs.find(
          (input) => input.name === newId,
        );

        if (!newInputSpec) {
          return null;
        }

        const nodeData: NodeData = {
          readOnly: originalNode.data.readOnly,
          nodeManager,
        };

        const newNode = createInputNode(newInputSpec, nodeData);

        newNode.id = newNodeId;
        newNode.selected = false;

        // Move selection to new node by default
        if (selected) {
          originalNode.selected = false;
          newNode.selected = true;
        }

        newNode.measured = originalNode.measured;

        updatedNodes.push(originalNode);

        return newNode;
      } else if (isOutputNode(originalNode)) {
        const newOutputSpec = updatedOutputs.find(
          (output) => output.name === newId,
        );

        if (!newOutputSpec) {
          return null;
        }

        const nodeData: NodeData = {
          readOnly: originalNode.data.readOnly,
          nodeManager,
        };

        const newNode = createOutputNode(newOutputSpec, nodeData);

        newNode.id = newNodeId;

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

      const newId = nodeManager.getRefId(node.id);

      if (!newId) {
        return null;
      }

      if (isTaskNode(node)) {
        const taskSpec = node.data.taskSpec;
        const annotations = taskSpec.annotations || {};

        const updatedAnnotations = setPositionInAnnotations(
          annotations,
          newPosition,
        );

        const newTaskSpec = {
          ...taskSpec,
          annotations: updatedAnnotations,
        };

        updatedGraphSpec.tasks[newId] = newTaskSpec;
      } else if (isInputNode(node)) {
        const inputSpec = updatedInputs.find((input) => input.name === newId);

        if (!inputSpec) {
          return;
        }

        const annotations = inputSpec.annotations || {};

        const updatedAnnotations = setPositionInAnnotations(
          annotations,
          newPosition,
        );

        const newInputSpec: InputSpec = {
          ...inputSpec,
          annotations: updatedAnnotations,
        };

        const updatedInputIndex = updatedInputs.findIndex(
          (input) => input.name === newId,
        );

        if (updatedInputIndex !== -1) {
          updatedInputs[updatedInputIndex] = newInputSpec;
        }
      } else if (isOutputNode(node)) {
        const outputSpec = updatedOutputs.find(
          (output) => output.name === newId,
        );

        if (!outputSpec) {
          return;
        }

        const annotations = outputSpec.annotations || {};

        const updatedAnnotations = setPositionInAnnotations(
          annotations,
          newPosition,
        );

        const newOutputSpec: OutputSpec = {
          ...outputSpec,
          annotations: updatedAnnotations,
        };

        const updatedOutputIndex = updatedOutputs.findIndex(
          (output) => output.name === newId,
        );

        if (updatedOutputIndex !== -1) {
          updatedOutputs[updatedOutputIndex] = newOutputSpec;
        }
      }

      node.position = newPosition;
    });
  }

  const updatedComponentSpec = {
    ...componentSpec,
    inputs: updatedInputs,
    outputs: updatedOutputs,
  };

  if (isGraphImplementation(updatedComponentSpec.implementation)) {
    updatedComponentSpec.implementation.graph = updatedGraphSpec;
  }

  return { updatedComponentSpec, nodeIdMap, newNodes, updatedNodes };
};

function reconfigureConnections(
  taskSpec: TaskSpec,
  argKey: string,
  argument: TaskOutputArgument | GraphInputArgument,
  nodeIdMap: Record<string, string>,
  nodes: Node[],
  componentSpec: ComponentSpec,
  mode: ConnectionMode,
  nodeManager: NodeManager,
) {
  let oldNodeId: string | undefined = undefined;
  let newArgId: string | undefined = undefined;
  let isExternal = false;

  if ("taskOutput" in argument) {
    const oldTaskId = argument.taskOutput.taskId;

    const taskNode = nodes.find(
      (node) => isTaskNode(node) && node.data.taskId === oldTaskId,
    );

    if (taskNode) {
      oldNodeId = taskNode.id;
      isExternal = false;
    } else {
      if (!isGraphImplementation(componentSpec.implementation)) {
        throw new Error(
          "ComponentSpec does not contain a graph implementation.",
        );
      }

      const graphSpec = componentSpec.implementation.graph;
      isExternal = oldTaskId in graphSpec.tasks;
    }

    if (!oldNodeId) {
      return reconfigureExternalConnection(taskSpec, argKey, mode);
    }

    const newNodeId = nodeIdMap[oldNodeId];
    if (!newNodeId) {
      return reconfigureExternalConnection(taskSpec, argKey, mode);
    }

    const newTaskId = nodeManager.getRefId(newNodeId);
    newArgId = newTaskId;
  } else if ("graphInput" in argument) {
    const oldInputName = argument.graphInput.inputName;

    const inputNode = nodes.find(
      (node) => isInputNode(node) && node.data.spec.name === oldInputName,
    );

    if (inputNode) {
      oldNodeId = inputNode.id;
      isExternal = false;
    } else {
      const inputs = componentSpec.inputs || [];
      isExternal = inputs.some((input) => input.name === oldInputName);
    }

    if (!oldNodeId) {
      return reconfigureExternalConnection(taskSpec, argKey, mode);
    }

    const newNodeId = nodeIdMap[oldNodeId];
    if (!newNodeId) {
      return reconfigureExternalConnection(taskSpec, argKey, mode);
    }

    const newInputName = nodeManager.getRefId(newNodeId);
    newArgId = newInputName;
  }

  if (!newArgId) {
    return reconfigureExternalConnection(taskSpec, argKey, mode);
  }

  const isInternal = nodes.some((node) => node.id === oldNodeId);

  const specWithRemovedArg = removeArgumentFromTaskSpec(taskSpec, argKey);
  const specWithReconfiguredArg = updateTaskArgumentConnection(
    taskSpec,
    argKey,
    argument,
    newArgId,
  );

  switch (mode) {
    case "none":
      // Remove all links
      return specWithRemovedArg;
    case "internal":
      // Maintain links only between duplicated nodes
      return isInternal ? specWithReconfiguredArg : specWithRemovedArg;
    case "external":
      // Maintain links only to original nodes outside the group
      return isExternal && !isInternal ? taskSpec : specWithRemovedArg;
    case "all":
      // Maintain all links
      if (isInternal) {
        return specWithReconfiguredArg;
      } else if (isExternal) {
        return taskSpec;
      } else {
        return specWithRemovedArg;
      }
  }
}

function reconfigureExternalConnection(
  taskSpec: TaskSpec,
  argKey: string,
  mode: ConnectionMode,
): TaskSpec {
  // The connected node is NOT also part of the duplication operation, so full reconfiguration is not required
  const specWithRemovedArg = removeArgumentFromTaskSpec(taskSpec, argKey);

  if (mode === "internal" || mode === "none") {
    return specWithRemovedArg;
  } else if (mode === "external" || mode === "all") {
    return taskSpec;
  }

  // Fallback - no changes to the task spec
  return taskSpec;
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

function updateTaskArgumentConnection(
  taskSpec: TaskSpec,
  argKey: string,
  argument: TaskOutputArgument | GraphInputArgument,
  newArgId: string,
): TaskSpec {
  if ("taskOutput" in argument) {
    return {
      ...taskSpec,
      arguments: {
        ...taskSpec.arguments,
        [argKey]: {
          ...argument,
          taskOutput: {
            ...argument.taskOutput,
            taskId: newArgId,
          },
        },
      },
    };
  } else if ("graphInput" in argument) {
    return {
      ...taskSpec,
      arguments: {
        ...taskSpec.arguments,
        [argKey]: {
          ...argument,
          graphInput: {
            ...argument.graphInput,
            inputName: newArgId,
          },
        },
      },
    };
  }

  // fallback - no changes
  return taskSpec;
}
