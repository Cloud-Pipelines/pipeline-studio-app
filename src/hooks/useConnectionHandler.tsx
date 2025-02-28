import { useCallback } from 'react';
import type { Connection, Edge } from "@xyflow/react";
import type { ArgumentType, GraphInputArgument, TaskOutputArgument } from "../componentSpec";

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

interface ConnectionHandlerProps {
  setTaskArgument: (taskId: string, inputName: string, argument?: ArgumentType) => void;
  setGraphOutputValue: (outputName: string, outputValue?: any) => void;
}

export function useConnectionHandler({
  setTaskArgument,
  setGraphOutputValue
}: ConnectionHandlerProps) {

  const handleConnection = useCallback((connection: Connection | Edge) => {
    if (connection.source === null || connection.target === null) {
        console.error(
          "addConnection called with missing source or target: ",
          connection
        );
        return;
      }

      const targetTaskInputName = connection.targetHandle?.replace(/^input_/, "");
      const sourceTaskOutputName = connection.sourceHandle?.replace(/^output_/, "");

      if (sourceTaskOutputName !== undefined) {
        // Source is task output
        const taskOutputArgument: TaskOutputArgument = {
          taskOutput: {
            taskId: nodeIdToTaskId(connection.source),
            outputName: sourceTaskOutputName,
          },
        };

        if (targetTaskInputName !== undefined) {
          // Target is task input
          setTaskArgument(
            nodeIdToTaskId(connection.target),
            targetTaskInputName,
            taskOutputArgument
          );
        } else {
          // Target is graph output
          setGraphOutputValue(
            nodeIdToOutputName(connection.target),
            taskOutputArgument
          );
          // TODO: Perhaps propagate type information
        }
      } else {
        // Source is graph input
        const graphInputName = nodeIdToInputName(connection.source);
        const graphInputArgument: GraphInputArgument = {
          graphInput: {
            inputName: graphInputName,
          },
        };
        if (targetTaskInputName !== undefined) {
          // Target is task input
          setTaskArgument(
            nodeIdToTaskId(connection.target),
            targetTaskInputName,
            graphInputArgument
          );
          // TODO: Perhaps propagate type information
        } else {
          // Target is graph output
          console.error(
            "addConnection: Cannot directly connect graph input to graph output: ",
            connection
          );
        }
      }
  }, [setTaskArgument, setGraphOutputValue]);

  return handleConnection;
}
