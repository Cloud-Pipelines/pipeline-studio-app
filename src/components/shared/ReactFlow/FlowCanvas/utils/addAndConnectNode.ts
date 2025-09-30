import type { Connection, Handle } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import {
  type ComponentReference,
  type ComponentSpec,
  isGraphImplementation,
  type TaskSpec,
  type TypeSpecType,
} from "@/utils/componentSpec";
import { DEFAULT_NODE_DIMENSIONS } from "@/utils/constants";
import {
  inputNameToInputId,
  outputNameToOutputId,
} from "@/utils/nodes/conversions";

import addTask from "./addTask";
import { handleConnection } from "./handleConnection";

type AddAndConnectNodeParams = {
  componentRef: ComponentReference;
  fromHandle: Handle | null;
  position: { x: number; y: number };
  componentSpec: ComponentSpec;
  nodeManager: NodeManager;
};

export function addAndConnectNode({
  componentRef,
  fromHandle,
  position,
  componentSpec,
  nodeManager,
}: AddAndConnectNodeParams): ComponentSpec {
  // 1. Add the new node
  const taskSpec: TaskSpec = {
    annotations: {},
    componentRef: { ...componentRef },
  };

  if (!isGraphImplementation(componentSpec.implementation)) {
    return componentSpec;
  }

  const oldGraphSpec = componentSpec.implementation.graph;

  const fromHandleId = fromHandle?.id;
  const fromHandleType = fromHandleId?.startsWith("input") ? "input" : "output";

  const adjustedPosition =
    fromHandleType === "input"
      ? { ...position, x: position.x - DEFAULT_NODE_DIMENSIONS.w }
      : position;

  const newComponentSpec = addTask(
    "task",
    taskSpec,
    adjustedPosition,
    componentSpec,
  );

  // 2. Find the new node
  if (!isGraphImplementation(newComponentSpec.implementation)) {
    return newComponentSpec;
  }

  const graphSpec = newComponentSpec.implementation.graph;

  const newTaskId = Object.keys(graphSpec.tasks).find(
    (key) => !(key in oldGraphSpec.tasks),
  );

  if (!newTaskId) {
    return newComponentSpec;
  }

  const newNodeId = nodeManager.getNodeId(newTaskId, "task");

  // 3. Determine the connection data type and find the first matching handle on the new node
  if (!fromHandle) {
    return newComponentSpec;
  }

  const fromTaskId = nodeManager.getTaskId(fromHandle.nodeId);
  if (!fromTaskId) {
    return newComponentSpec;
  }

  const fromTaskSpec = graphSpec.tasks[fromTaskId];
  const fromComponentSpec = fromTaskSpec?.componentRef.spec;

  const fromNodeId = fromHandle.nodeId;

  const fromHandleName = fromHandleId?.replace(`${fromHandleType}_`, "");

  let connectionType: TypeSpecType | undefined;
  if (fromHandleType === "input") {
    connectionType = fromComponentSpec?.inputs?.find(
      (io) => io.name === fromHandleName,
    )?.type;
  } else if (fromHandleType === "output") {
    connectionType = fromComponentSpec?.outputs?.find(
      (io) => io.name === fromHandleName,
    )?.type;
  }

  // Find the first matching handle on the new node
  const toHandleType = fromHandleType === "input" ? "output" : "input";

  let targetHandleId: string | undefined;

  if (toHandleType === "input") {
    const handleName = componentRef.spec?.inputs?.find(
      (io) => io.type === connectionType,
    )?.name;
    if (!handleName) {
      return newComponentSpec;
    }

    const inputId = inputNameToInputId(handleName);
    targetHandleId = nodeManager.getNodeId(inputId, "taskInput");
  } else if (toHandleType === "output") {
    const handleName = componentRef.spec?.outputs?.find(
      (io) => io.type === connectionType,
    )?.name;
    if (!handleName) {
      return newComponentSpec;
    }

    const outputId = outputNameToOutputId(handleName);
    targetHandleId = nodeManager.getNodeId(outputId, "taskOutput");
  }

  // 4. Build a Connection object and use handleConnection to add the edge
  if (fromNodeId && fromHandleId && targetHandleId) {
    const isReversedConnection =
      fromHandleType === "input" && toHandleType === "output";
    const connection: Connection = isReversedConnection
      ? // Drawing from an input handle to a new output handle
        {
          source: newNodeId,
          sourceHandle: targetHandleId,
          target: fromNodeId,
          targetHandle: fromHandleId,
        }
      : // Drawing from an output handle to a new input handle
        {
          source: fromNodeId,
          sourceHandle: fromHandleId,
          target: newNodeId,
          targetHandle: targetHandleId,
        };

    const updatedGraphSpec = handleConnection(
      graphSpec,
      connection,
      nodeManager,
    );

    return {
      ...newComponentSpec,
      implementation: {
        ...newComponentSpec.implementation,
        graph: updatedGraphSpec,
      },
    };
  }

  return newComponentSpec;
}
