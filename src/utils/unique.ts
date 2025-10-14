import type { ComponentSpec, GraphSpec } from "./componentSpec";

const makeNameUniqueByAddingIndex = (
  name: string,
  existingNames: Set<string>,
): string => {
  const baseName = name.replace(/ \(\d+\)$/, "");
  let finalName = baseName;
  let index = 1;
  while (existingNames.has(finalName)) {
    index++;
    finalName = baseName + " (" + index.toString() + ")";
  }
  return finalName;
};

export const getUniqueInputName = (
  componentSpec: ComponentSpec,
  name: string = "Input",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.inputs?.map((inputSpec) => inputSpec.name)),
  );
};

export const getUniqueOutputName = (
  componentSpec: ComponentSpec,
  name: string = "Output",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.outputs?.map((outputSpec) => outputSpec.name)),
  );
};

export const getUniqueTaskId = (
  graphSpec: GraphSpec,
  name: string = "Task",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(Object.keys(graphSpec.tasks)),
  );
};
