import type { Connection, Handle } from "@xyflow/react";

import type { NodeManager, NodeType } from "@/nodeManager";
import {
  type ComponentReference,
  type ComponentSpec,
  isGraphImplementation,
  type TaskSpec,
  type TypeSpecType,
} from "@/utils/componentSpec";
import { DEFAULT_NODE_DIMENSIONS } from "@/utils/constants";

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

  if (!fromHandle?.id) {
    return componentSpec;
  }

  const fromNodeId = fromHandle.nodeId;
  const fromNodeType = nodeManager.getNodeType(fromNodeId);
  const fromTaskId = nodeManager.getRefId(fromNodeId);

  if (!fromTaskId) {
    return componentSpec;
  }

  let fromHandleType: NodeType | undefined;
  let fromHandleName: string | undefined;

  if (fromNodeType === "task") {
    const fromHandleInfo = nodeManager.getHandleInfo(fromHandle.id);
    fromHandleName = fromHandleInfo?.handleName;
    fromHandleType = nodeManager.getNodeType(fromHandle.id);
  } else if (fromNodeType === "input") {
    fromHandleType = "handle-out";
    fromHandleName = fromTaskId;
  } else if (fromNodeType === "output") {
    fromHandleType = "handle-in";
    fromHandleName = fromTaskId;
  } else {
    return componentSpec;
  }

  if (!fromHandleName) {
    return componentSpec;
  }

  if (
    !fromHandleType ||
    (fromHandleType !== "handle-in" && fromHandleType !== "handle-out")
  ) {
    return componentSpec;
  }

  const adjustedPosition =
    fromHandleType === "handle-in"
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
  let fromComponentSpec: ComponentSpec | undefined;

  if (fromNodeType === "task") {
    // Get spec from task
    const fromTaskSpec = graphSpec.tasks[fromTaskId];
    fromComponentSpec = fromTaskSpec?.componentRef.spec;
  } else {
    // For IO nodes, get spec from component spec
    fromComponentSpec = componentSpec;
  }

  let connectionType: TypeSpecType | undefined;
  if (fromHandleType === "handle-in") {
    connectionType = fromComponentSpec?.inputs?.find(
      (io) => io.name === fromHandleName,
    )?.type;
  } else if (fromHandleType === "handle-out") {
    connectionType = fromComponentSpec?.outputs?.find(
      (io) => io.name === fromHandleName,
    )?.type;
  }

  // Find the first matching handle on the new node
  const toHandleType =
    fromHandleType === "handle-in" ? "handle-out" : "handle-in";

  const inputHandleName = componentRef.spec?.inputs?.find(
    (io) => io.type === connectionType,
  )?.name;

  const outputHandleName = componentRef.spec?.outputs?.find(
    (io) => io.type === connectionType,
  )?.name;

  const toHandleName =
    toHandleType === "handle-in" ? inputHandleName : outputHandleName;

  if (!toHandleName) {
    return newComponentSpec;
  }

  const targetHandleId = nodeManager.getHandleNodeId(
    newTaskId,
    toHandleName,
    toHandleType,
  );

  // 4. Build a Connection object and use handleConnection to add the edge
  if (targetHandleId) {
    const fromNodeId = fromHandle.nodeId;
    const fromHandleId = fromHandle.id;

    const isReversedConnection =
      fromHandleType === "handle-in" && toHandleType === "handle-out";

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
