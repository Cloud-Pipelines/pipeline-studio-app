import type { GraphSpec, TaskOutputArgument } from "@/utils/componentSpec";

export const setGraphOutputValue = (
  graphSpec: GraphSpec,
  outputName: string,
  outputValue?: TaskOutputArgument,
) => {
  let newGraphOutputValues;

  if (outputValue) {
    newGraphOutputValues = {
      ...graphSpec.outputValues,
      [outputName]: outputValue,
    };
  } else {
    // Remove the output value (for edge deletion)
    const { [outputName]: removed, ...remaining } =
      graphSpec.outputValues || {};
    newGraphOutputValues = remaining;
  }

  const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };

  return newGraphSpec;
};
