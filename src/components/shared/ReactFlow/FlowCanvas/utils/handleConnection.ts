import type { Connection } from "@xyflow/react";

import type {
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "@/utils/componentSpec";
import {
  nodeIdToInputName,
  nodeIdToOutputName,
  nodeIdToTaskId,
} from "@/utils/nodes/nodeIdUtils";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
) => {
  const targetTaskInputName = connection.targetHandle?.replace(/^input_/, "");
  const sourceTaskOutputName = connection.sourceHandle?.replace(/^output_/, "");

  if (sourceTaskOutputName !== undefined) {
    const taskOutputArgument: TaskOutputArgument = {
      taskOutput: {
        taskId: nodeIdToTaskId(connection.source),
        outputName: sourceTaskOutputName,
      },
    };

    if (targetTaskInputName !== undefined) {
      return setTaskArgument(
        graphSpec,
        nodeIdToTaskId(connection.target),
        targetTaskInputName,
        taskOutputArgument,
      );
    } else {
      return setGraphOutputValue(
        graphSpec,
        nodeIdToOutputName(connection.target),
        taskOutputArgument,
      );
      // TODO: Perhaps propagate type information
    }
  } else {
    const graphInputName = nodeIdToInputName(connection.source);
    const graphInputArgument: GraphInputArgument = {
      graphInput: {
        inputName: graphInputName,
      },
    };
    if (targetTaskInputName !== undefined) {
      return setTaskArgument(
        graphSpec,
        nodeIdToTaskId(connection.target),
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
