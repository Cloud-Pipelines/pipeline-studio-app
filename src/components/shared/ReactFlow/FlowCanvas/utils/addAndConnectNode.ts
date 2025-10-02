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
  inputIdToInputName,
  outputIdToOutputName,
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

  if (!fromHandle?.id) {
    return componentSpec;
  }

  const isTaskHandle = nodeManager.isManaged(fromHandle.id);
  let fromHandleType: "input" | "output";
  let fromHandleName: string | undefined;
  let fromTaskId: string | undefined;

  if (isTaskHandle) {
    // Handle is managed by NodeManager (task handle)
    const fromHandleInfo = nodeManager.getHandleInfo(fromHandle.id);
    const fromNodeType = nodeManager.getNodeType(fromHandle.id);

    if (!fromHandleInfo || !fromNodeType) {
      return componentSpec;
    }

    fromHandleType = fromNodeType === "taskInput" ? "input" : "output";
    fromHandleName = fromHandleInfo.handleName;
    fromTaskId = fromHandleInfo.taskId;
  } else {
    // Simple IO node handle - get info from the source node, not the handle
    const fromNodeId = fromHandle.nodeId;
    const fromNodeType = nodeManager.getNodeType(fromNodeId);

    if (!fromNodeType) {
      return componentSpec;
    }

    if (fromNodeType === "input") {
      fromHandleType = "output";
      const inputId = nodeManager.getTaskId(fromNodeId);
      if (inputId) {
        fromHandleName = inputIdToInputName(inputId);
        fromTaskId = inputId;
      }
    } else if (fromNodeType === "output") {
      fromHandleType = "input";
      const outputId = nodeManager.getTaskId(fromNodeId);
      if (outputId) {
        fromHandleName = outputIdToOutputName(outputId);
        fromTaskId = outputId;
      }
    } else {
      return componentSpec;
    }
  }

  if (!fromTaskId || !fromHandleName) {
    return componentSpec;
  }

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
  let fromComponentSpec: ComponentSpec | undefined;

  if (isTaskHandle) {
    // Get spec from task
    const fromTaskSpec = graphSpec.tasks[fromTaskId];
    fromComponentSpec = fromTaskSpec?.componentRef.spec;
  } else {
    // For IO nodes, get spec from component spec
    fromComponentSpec = componentSpec;
  }

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

    targetHandleId = nodeManager.getTaskHandleNodeId(
      newTaskId,
      handleName,
      "taskInput",
    );
  } else if (toHandleType === "output") {
    const handleName = componentRef.spec?.outputs?.find(
      (io) => io.type === connectionType,
    )?.name;
    if (!handleName) {
      return newComponentSpec;
    }

    targetHandleId = nodeManager.getTaskHandleNodeId(
      newTaskId,
      handleName,
      "taskOutput",
    );
  }

  // 4. Build a Connection object and use handleConnection to add the edge
  if (targetHandleId) {
    const fromNodeId = fromHandle.nodeId;
    const fromHandleId = fromHandle.id;

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
