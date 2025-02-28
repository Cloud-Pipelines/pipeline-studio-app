import { useCallback } from "react";
import type { Connection, Edge } from "@xyflow/react";
import type {
  ArgumentType,
  GraphInputArgument,
  TaskOutputArgument,
} from "../componentSpec";

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

interface ConnectionHandlerProps {
  setTaskArgument: (
    taskId: string,
    inputName: string,
    argument?: ArgumentType,
  ) => void;
  setGraphOutputValue: (outputName: string, outputValue?: any) => void;
}

export function useConnectionHandler({
  setTaskArgument,
  setGraphOutputValue,
}: ConnectionHandlerProps) {
  const handleConnection = useCallback(
    (connection: Connection | Edge) => {
      const targetTaskInputName = connection.targetHandle?.replace(
        /^input_/,
        "",
      );
      const sourceTaskOutputName = connection.sourceHandle?.replace(
        /^output_/,
        "",
      );

      if (sourceTaskOutputName !== undefined) {
        const taskOutputArgument: TaskOutputArgument = {
          taskOutput: {
            taskId: nodeIdToTaskId(connection.source),
            outputName: sourceTaskOutputName,
          },
        };

        if (targetTaskInputName !== undefined) {
          setTaskArgument(
            nodeIdToTaskId(connection.target),
            targetTaskInputName,
            taskOutputArgument,
          );
        } else {
          setGraphOutputValue(
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
          setTaskArgument(
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
    },
    [setTaskArgument, setGraphOutputValue],
  );

  return handleConnection;
}
