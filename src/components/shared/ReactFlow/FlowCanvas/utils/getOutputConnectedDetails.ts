/**
 * Returns the connected output value (outputName) for a given output name from a graphSpec's outputValues.
 * Returns undefined if not connected.
 */
export interface OutputConnectedDetails {
  outputName: string;
  outputType: string;
  taskId: string;
}

export function getOutputConnectedDetails(
  graphSpec: any,
  outputName: string,
): OutputConnectedDetails {
  if (graphSpec?.outputValues) {
    const outputValue = graphSpec.outputValues[outputName];
    if (
      outputValue &&
      typeof outputValue === "object" &&
      "taskOutput" in outputValue
    ) {
      const type =
        graphSpec.tasks[
          outputValue.taskOutput.taskId
        ]?.componentRef?.spec?.outputs?.find(
          (output: any) => output.name === outputValue.taskOutput.outputName,
        )?.type || "Any";
      return {
        outputName: outputValue.taskOutput.outputName,
        outputType: type,
        taskId: outputValue.taskOutput.taskId,
      };
    }
  }
  return {
    outputName: "Not connected",
    outputType: "Any",
    taskId: "",
  };
}
