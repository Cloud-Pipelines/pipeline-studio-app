import type { Connection } from "@xyflow/react";

import type { HandleInfo, NodeManager, NodeType } from "@/nodeManager";
import type {
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "@/utils/componentSpec";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

type NodeInfo = {
  refId: string;
  type?: NodeType;
  handle?: HandleInfo;
};

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
  nodeManager: NodeManager,
) => {
  const sourceId = nodeManager.getRefId(connection.source);
  const sourceType = nodeManager.getNodeType(connection.source);

  const targetId = nodeManager.getRefId(connection.target);
  const targetType = nodeManager.getNodeType(connection.target);

  if (!sourceId || !targetId || !sourceType || !targetType) {
    console.error("Could not resolve node information:", {
      sourceId,
      sourceType,
      targetId,
      targetType,
    });
    return graphSpec;
  }

  if (sourceId === targetId) {
    console.warn("Cannot connect node to itself");
    return graphSpec;
  }

  let sourceHandleInfo: HandleInfo | undefined;
  let targetHandleInfo: HandleInfo | undefined;

  if (connection.sourceHandle) {
    sourceHandleInfo = nodeManager.getHandleInfo(connection.sourceHandle);
  }

  if (connection.targetHandle) {
    targetHandleInfo = nodeManager.getHandleInfo(connection.targetHandle);
  }

  const source: NodeInfo = {
    refId: sourceId,
    type: sourceType,
    handle: sourceHandleInfo,
  };

  const target: NodeInfo = {
    refId: targetId,
    type: targetType,
    handle: targetHandleInfo,
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
      console.error("Unsupported connection pattern:", connectionType);
      return graphSpec;
  }
};

const handleGraphInputToTask = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!target.handle?.handleName) {
    console.error(
      "Target handle name missing for graph input to task connection",
    );
    return graphSpec;
  }

  const inputName = source.refId;
  const targetInputName = target.handle.handleName;

  const graphInputArgument: GraphInputArgument = {
    graphInput: { inputName },
  };

  return setTaskArgument(
    graphSpec,
    target.refId,
    targetInputName,
    graphInputArgument,
  );
};

const handleTaskToTask = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!source.handle?.handleName) {
    console.error("Source handle name missing for task to task connection");
    return graphSpec;
  }

  if (!target.handle?.handleName) {
    console.error("Target handle name missing for task to task connection");
    return graphSpec;
  }

  const sourceOutputName = source.handle.handleName;
  const targetInputName = target.handle.handleName;

  const taskOutputArgument: TaskOutputArgument = {
    taskOutput: {
      taskId: source.refId,
      outputName: sourceOutputName,
    },
  };

  return setTaskArgument(
    graphSpec,
    target.refId,
    targetInputName,
    taskOutputArgument,
  );
};

const handleTaskToGraphOutput = (
  graphSpec: GraphSpec,
  source: NodeInfo,
  target: NodeInfo,
): GraphSpec => {
  if (!source.handle?.handleName) {
    console.error(
      "Source handle name missing for task to graph output connection",
    );
    return graphSpec;
  }

  const sourceOutputName = source.handle.handleName;
  const outputName = target.refId;

  const taskOutputArgument: TaskOutputArgument = {
    taskOutput: {
      taskId: source.refId,
      outputName: sourceOutputName,
    },
  };

  return setGraphOutputValue(graphSpec, outputName, taskOutputArgument);
};
