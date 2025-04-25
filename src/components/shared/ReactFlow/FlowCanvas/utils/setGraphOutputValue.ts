import type { GraphSpec, TaskOutputArgument } from "@/utils/componentSpec";

export const setGraphOutputValue = (
  graphSpec: GraphSpec,
  outputName: string,
  outputValue?: TaskOutputArgument,
) => {
  const nonNullOutputObject = outputValue ? { [outputName]: outputValue } : {};
  const newGraphOutputValues = {
    ...graphSpec.outputValues,
    ...nonNullOutputObject,
  };
  const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };

  return newGraphSpec;
};
