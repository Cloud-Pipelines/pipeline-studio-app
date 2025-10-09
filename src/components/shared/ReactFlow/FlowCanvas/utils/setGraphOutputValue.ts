import type { GraphSpec, TaskOutputArgument } from "@/utils/componentSpec";

export const setGraphOutputValue = (
  graphSpec: GraphSpec,
  outputId: string,
  outputValue?: TaskOutputArgument,
) => {
  let newGraphOutputValues;

  if (outputValue) {
    newGraphOutputValues = {
      ...graphSpec.outputValues,
      [outputId]: outputValue,
    };
  } else {
    // Remove the output value (for edge deletion)
    const { [outputId]: removed, ...remaining } = graphSpec.outputValues || {};
    newGraphOutputValues = remaining;
  }

  const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };

  return newGraphSpec;
};
