import type { Connection } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import type {
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "@/utils/componentSpec";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
  nodeManager: NodeManager,
) => {
  const sourceId = nodeManager.getRefId(connection.source);
  const targetId = nodeManager.getRefId(connection.target);

  const sourceHandleName = connection.sourceHandle
    ? nodeManager.getHandleInfo(connection.sourceHandle)?.handleName
    : undefined;
  const targetHandleName = connection.targetHandle
    ? nodeManager.getHandleInfo(connection.targetHandle)?.handleName
    : undefined;

  // Previously sourceHandle & targetHandle were `undefined` for IO Nodes, but in the new NodeManager system the handles now have an id & name.
  // Thus, if the handle name is the same as the input/output name, treat it as undefined.
  const sourceTaskOutputName =
    sourceId && sourceHandleName === sourceId ? undefined : sourceHandleName;
  const targetTaskInputName =
    targetId && targetHandleName === targetId ? undefined : targetHandleName;

  if (sourceTaskOutputName !== undefined && sourceId) {
    const taskOutputArgument: TaskOutputArgument = {
      taskOutput: {
        taskId: sourceId,
        outputName: sourceTaskOutputName,
      },
    };

    if (targetTaskInputName !== undefined && targetId) {
      return setTaskArgument(
        graphSpec,
        targetId,
        targetTaskInputName,
        taskOutputArgument,
      );
    } else if (targetId) {
      return setGraphOutputValue(graphSpec, targetId, taskOutputArgument);
      // TODO: Perhaps propagate type information
    }
  } else if (sourceId) {
    const graphInputName = sourceId;
    const graphInputArgument: GraphInputArgument = {
      graphInput: {
        inputName: graphInputName,
      },
    };
    if (targetTaskInputName !== undefined && targetId) {
      return setTaskArgument(
        graphSpec,
        targetId,
        targetTaskInputName,
        graphInputArgument,
      );
    } else {
      console.error(
        "addConnection: Cannot directly connect graph input to graph output: ",
        connection,
      );
    }
  }

  // GraphSpec was not updated (due to an error or other reason)
  return graphSpec;
};
