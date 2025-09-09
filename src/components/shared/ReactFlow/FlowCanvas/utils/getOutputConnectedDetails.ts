import type { GraphSpec } from "@/utils/componentSpec";

/**
 * Returns the connected output value (outputName) for a given output name from a graphSpec's outputValues.
 * Returns undefined if not connected.
 */
export interface OutputConnectedDetails {
  outputName?: string;
  outputType?: string;
  taskId?: string;
}

export function getOutputConnectedDetails(
  graphSpec: GraphSpec,
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
          (output) => output.name === outputValue.taskOutput.outputName,
        )?.type || "Any";

      return {
        outputName: outputValue.taskOutput.outputName,
        outputType: type as string,
        taskId: outputValue.taskOutput.taskId,
      };
    }
  }

  return {
    outputName: undefined,
    outputType: undefined,
    taskId: undefined,
  };
}
