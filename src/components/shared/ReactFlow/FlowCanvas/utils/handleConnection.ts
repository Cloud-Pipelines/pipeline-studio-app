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
  type?: NodeType;
  handle?: {
    taskId: string;
    handleName: string;
  };
};

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
  nodeManager: NodeManager,
) => {
  const sourceId = nodeManager.getTaskId(connection.source!);
  const sourceType = nodeManager.getNodeType(connection.source!);

  const targetId = nodeManager.getTaskId(connection.target!);
  const targetType = nodeManager.getNodeType(connection.target!);

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

  let sourceHandleInfo: { taskId: string; handleName: string } | undefined;
  let targetHandleInfo: { taskId: string; handleName: string } | undefined;

  if (connection.sourceHandle) {
    sourceHandleInfo = nodeManager.getHandleInfo(connection.sourceHandle);
  }

  if (connection.targetHandle) {
    targetHandleInfo = nodeManager.getHandleInfo(connection.targetHandle);
  }

  const source: NodeInfo = {
    id: sourceId,
    type: sourceType,
    handle: sourceHandleInfo,
  };

  const target: NodeInfo = {
    id: targetId,
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

  const inputId = source.id;
  const inputName = inputIdToInputName(inputId);
  const targetInputName = target.handle.handleName;

  const graphInputArgument: GraphInputArgument = {
    graphInput: { inputName },
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
  if (!source.handle?.handleName) {
    console.error(
      "Source handle name missing for task to graph output connection",
    );
    return graphSpec;
  }

  const sourceOutputName = source.handle.handleName;
  const outputId = target.id;
  const outputName = outputIdToOutputName(outputId);

  const taskOutputArgument: TaskOutputArgument = {
    taskOutput: {
      taskId: source.id,
      outputName: sourceOutputName,
    },
  };

  return setGraphOutputValue(graphSpec, outputName, taskOutputArgument);
};
