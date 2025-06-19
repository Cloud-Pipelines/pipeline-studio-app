import type { Connection, Handle } from "@xyflow/react";

import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
  TypeSpecType,
} from "@/utils/componentSpec";
import { nodeIdToTaskId, taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";

import addTask from "./addTask";
import { handleConnection } from "./handleConnection";

type AddAndConnectNodeParams = {
  componentRef: ComponentReference;
  fromHandle: Handle | null;
  position: { x: number; y: number };
  componentSpec: ComponentSpec;
};

export function addAndConnectNode({
  componentRef,
  fromHandle,
  position,
  componentSpec,
}: AddAndConnectNodeParams): { componentSpec: ComponentSpec; taskId?: string } {
  // 1. Add the new node
  const taskSpec: TaskSpec = {
    annotations: {},
    componentRef: { ...componentRef },
  };

  if (!("graph" in componentSpec.implementation)) {
    return { componentSpec };
  }

  const oldGraphSpec = componentSpec.implementation.graph;

  const newComponentSpec = addTask("task", taskSpec, position, componentSpec);

  if (!("graph" in newComponentSpec.implementation)) {
    return { componentSpec: newComponentSpec };
  }

  const graphSpec = newComponentSpec.implementation.graph;

  // 2. Find the new node
  const newTaskId = Object.keys(graphSpec.tasks).find(
    (key) => !(key in oldGraphSpec.tasks),
  );

  if (!newTaskId) {
    return { componentSpec: newComponentSpec };
  }

  const newNodeId = taskIdToNodeId(newTaskId);

  // 3. Determine the connection data type and find the first matching handle on the new node
  if (!fromHandle) {
    return { componentSpec: newComponentSpec, taskId: newTaskId };
  }

  const fromTaskId = nodeIdToTaskId(fromHandle.nodeId);

  const fromTaskSpec = graphSpec.tasks[fromTaskId];
  const fromComponentSpec = fromTaskSpec?.componentRef.spec;

  const fromNodeId = fromHandle.nodeId;
  const fromHandleId = fromHandle.id;

  const fromHandleType = fromHandleId?.startsWith("input") ? "input" : "output";

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
    targetHandleId =
      "input_" +
      componentRef.spec?.inputs?.find((io) => io.type === connectionType)?.name;
  } else if (toHandleType === "output") {
    targetHandleId =
      "output_" +
      componentRef.spec?.outputs?.find((io) => io.type === connectionType)
        ?.name;
  }

  // 4. Build a Connection object and use handleConnection to add the edge
  if (fromNodeId && fromHandleId && targetHandleId) {
    const connection: Connection = {
      source: fromNodeId,
      sourceHandle: fromHandleId,
      target: newNodeId,
      targetHandle: targetHandleId,
    };

    const updatedGraphSpec = handleConnection(graphSpec, connection);

    return {
      componentSpec: {
        ...newComponentSpec,
        implementation: {
          ...newComponentSpec.implementation,
          graph: updatedGraphSpec,
        },
      },
      taskId: newTaskId,
    };
  }

  return { componentSpec: newComponentSpec, taskId: newTaskId };
}
