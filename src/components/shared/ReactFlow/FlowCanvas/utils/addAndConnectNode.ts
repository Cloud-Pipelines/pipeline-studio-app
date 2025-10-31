import type { Connection, Handle } from "@xyflow/react";

import type { HandleInfo, NodeManager, NodeType } from "@/nodeManager";
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

/* 
  Add a new task node to the graph and connect it to an existing handle 
  - ComponentRef: The component reference for the new task
  - fromHandle: The handle from which the connection originates (input or output handle)
  - position: The position to place the new task node
  - componentSpec: The current component specification containing the graph
  - nodeManager: The NodeManager instance for managing node IDs
*/

export function addAndConnectNode({
  componentRef,
  fromHandle,
  position,
  componentSpec,
  nodeManager,
}: AddAndConnectNodeParams): ComponentSpec {
  if (!isGraphImplementation(componentSpec.implementation) || !fromHandle?.id) {
    return componentSpec;
  }

  const handleInfo = nodeManager.getHandleInfo(fromHandle.id);
  const fromHandleType = handleInfo?.handleType;

  if (
    !handleInfo ||
    !fromHandleType ||
    !["handle-in", "handle-out"].includes(fromHandleType)
  ) {
    return componentSpec;
  }

  // 1. Create new task
  const newTaskSpec: TaskSpec = {
    annotations: {},
    componentRef: { ...componentRef },
  };

  const adjustedPosition =
    fromHandleType === "handle-in"
      ? { ...position, x: position.x - DEFAULT_NODE_DIMENSIONS.w }
      : position;

  const newComponentSpec = addTask(
    "task",
    newTaskSpec,
    adjustedPosition,
    componentSpec,
  );

  if (!isGraphImplementation(newComponentSpec.implementation)) {
    return componentSpec;
  }

  const oldTasks = componentSpec.implementation.graph.tasks;
  const newTasks = newComponentSpec.implementation.graph.tasks;
  const newTaskId = Object.keys(newTasks).find((key) => !(key in oldTasks));

  if (!newTaskId) return newComponentSpec;

  // 2. Find the first matching handle on the new task
  const connectionType = getConnectionType(
    handleInfo,
    fromHandleType,
    componentSpec,
    newTasks,
  );
  if (!connectionType) return newComponentSpec;

  const toHandleType =
    fromHandleType === "handle-in" ? "handle-out" : "handle-in";
  const toHandleName = findCompatibleHandle(
    componentRef,
    toHandleType,
    connectionType,
  );

  if (!toHandleName) return newComponentSpec;

  // 3. Create connection
  const newNodeId = nodeManager.getNodeId(newTaskId, "task");
  const targetHandleId = nodeManager.getHandleNodeId(
    newTaskId,
    toHandleName,
    toHandleType,
  );
  const isReversed =
    fromHandleType === "handle-in" && toHandleType === "handle-out";

  const connection: Connection = isReversed
    ? {
        source: newNodeId,
        sourceHandle: targetHandleId,
        target: fromHandle.nodeId,
        targetHandle: fromHandle.id,
      }
    : {
        source: fromHandle.nodeId,
        sourceHandle: fromHandle.id,
        target: newNodeId,
        targetHandle: targetHandleId,
      };

  const updatedGraphSpec = handleConnection(
    newComponentSpec.implementation.graph,
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

function getConnectionType(
  handleInfo: HandleInfo,
  handleType: NodeType,
  componentSpec: ComponentSpec,
  tasks: Record<string, TaskSpec>,
): TypeSpecType | undefined {
  let targetSpec: ComponentSpec | undefined;

  const taskSpec = tasks[handleInfo.parentRefId];

  if (taskSpec) {
    targetSpec = taskSpec.componentRef.spec;
  } else {
    targetSpec = componentSpec;
  }

  if (!targetSpec) return undefined;

  if (handleType === "handle-in") {
    return targetSpec.inputs?.find((io) => io.name === handleInfo.handleName)
      ?.type;
  } else {
    return targetSpec.outputs?.find((io) => io.name === handleInfo.handleName)
      ?.type;
  }
}

function findCompatibleHandle(
  componentRef: ComponentReference,
  handleType: "handle-in" | "handle-out",
  connectionType: TypeSpecType,
): string | undefined {
  const spec = componentRef.spec;
  if (!spec) return undefined;

  if (handleType === "handle-in") {
    return spec.inputs?.find((io) => io.type === connectionType)?.name;
  } else {
    return spec.outputs?.find((io) => io.type === connectionType)?.name;
  }
}
