import type { Connection } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import type {
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "@/utils/componentSpec";
import { inputIdToInputName } from "@/utils/nodes/conversions";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const handleConnection = (
  graphSpec: GraphSpec,
  connection: Connection,
  nodeManager: NodeManager,
) => {
  const targetTaskInputName = connection.targetHandle?.replace(/^input_/, "");
  const sourceTaskOutputName = connection.sourceHandle?.replace(/^output_/, "");

  const targetId = nodeManager.getTaskId(connection.target);
  const sourceId = nodeManager.getTaskId(connection.source);

  if (sourceTaskOutputName !== undefined) {
    if (!sourceId) {
      console.error(
        "addConnection: Could not find task ID for source node: ",
        connection.source,
      );
      return graphSpec;
    }

    const taskOutputArgument: TaskOutputArgument = {
      taskOutput: {
        taskId: sourceId,
        outputName: sourceTaskOutputName,
      },
    };

    if (targetTaskInputName !== undefined) {
      if (!targetId) {
        console.error(
          "addConnection: Could not find Input ID for target node: ",
          connection.target,
        );
        return graphSpec;
      }

      return setTaskArgument(
        graphSpec,
        targetId,
        targetTaskInputName,
        taskOutputArgument,
      );
    } else {
      if (!targetId) {
        console.error(
          "addConnection: Could not find Output ID for target node: ",
          connection.target,
        );
        return graphSpec;
      }

      return setGraphOutputValue(graphSpec, targetId, taskOutputArgument);
      // TODO: Perhaps propagate type information
    }
  } else {
    if (!sourceId) {
      console.error(
        "addConnection: Could not find task ID for source node: ",
        connection.source,
      );
      return graphSpec;
    }
    const inputName = inputIdToInputName(sourceId);
    const graphInputArgument: GraphInputArgument = {
      graphInput: {
        inputName: inputName,
      },
    };
    if (targetTaskInputName !== undefined) {
      if (!targetId) {
        console.error(
          "addConnection: Could not find Output ID for target node: ",
          connection.target,
        );
        return graphSpec;
      }

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
