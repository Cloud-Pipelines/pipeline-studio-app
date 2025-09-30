import type { Connection } from "@xyflow/react";

import type { NodeManager, NodeType } from "@/nodeManager";
import type {
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "@/utils/componentSpec";
import {
  inputIdToInputName,
  outputIdToOutputName,
} from "@/utils/nodes/conversions";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

type NodeInfo = {
  id: string;
  handle?: string;
  type?: NodeType;
};

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
  nodeManager: NodeManager,
) => {
  const sourceId = nodeManager.getTaskId(connection.source);
  const targetId = nodeManager.getTaskId(connection.target);

  if (!sourceId || !targetId) {
    console.warn("Source or Target ID is missing in the connection.");
    return graphSpec;
  }

  if (sourceId === targetId) {
    console.warn(
      "Source and Target IDs are the same. Self-connections are not allowed.",
    );
    return graphSpec;
  }

  const sourceHandleId = connection.sourceHandle
    ? nodeManager.getTaskId(connection.sourceHandle)
    : undefined;

  const targetHandleId = connection.targetHandle
    ? nodeManager.getTaskId(connection.targetHandle)
    : undefined;

  const source: NodeInfo = {
    id: sourceId,
    handle: sourceHandleId,
    type: nodeManager.getNodeType(connection.source),
  };

  const target: NodeInfo = {
    id: targetId,
    handle: targetHandleId,
    type: nodeManager.getNodeType(connection.target),
  };

  const connectionType = `${source.type}_to_${target.type}` as const;

  switch (connectionType) {
    case "input_to_task":
      return handleGraphInputToTask(graphSpec, source, target);

    case "task_to_task":
      return handleTaskToTask(graphSpec, source, target);

    case "task_to_output":
      return handleTaskToGraphOutput(graphSpec, source, target);

    default:
      console.warn("Unsupported connection pattern:", connectionType);
      return graphSpec;
  }
};

const handleGraphInputToTask = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!target.handle) {
    console.warn("Handle ID is missing for target task node.");
    return graphSpec;
  }

  const sourceInputName = inputIdToInputName(source.id);
  const targetInputName = inputIdToInputName(target.handle);

  const graphInputArgument: GraphInputArgument = {
    graphInput: { inputName: sourceInputName },
  };

  return setTaskArgument(
    graphSpec,
    target.id,
    targetInputName,
    graphInputArgument,
  );
};

const handleTaskToTask = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!source.handle) {
    console.warn("Handle ID is missing for source task node.");
    return graphSpec;
  }

  if (!target.handle) {
    console.warn("Handle ID is missing for target task node.");
    return graphSpec;
  }

  const sourceOutputName = outputIdToOutputName(source.handle);
  const targetInputName = inputIdToInputName(target.handle);

  const taskOutputArgument: TaskOutputArgument = {
    taskOutput: {
      taskId: source.id,
      outputName: sourceOutputName,
    },
  };

  return setTaskArgument(
    graphSpec,
    target.id,
    targetInputName,
    taskOutputArgument,
  );
};

const handleTaskToGraphOutput = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!source.handle) {
    console.warn("Handle ID is missing for source task node.");
    return graphSpec;
  }

  const sourceOutputName = outputIdToOutputName(source.handle);

  const taskOutputArgument: TaskOutputArgument = {
    taskOutput: {
      taskId: source.id,
      outputName: sourceOutputName,
    },
  };

  return setGraphOutputValue(graphSpec, target.id, taskOutputArgument);
};
