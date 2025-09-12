import { type ComponentSpec } from "@/utils/componentSpec";

export const checkNameCollision = (
  newName: string,
  currentOutputName: string,
  componentSpec: ComponentSpec,
  type: "inputs" | "outputs",
) => {
  if (!componentSpec[type]) return false;

  // Check if any other output (not the current one) has the same name
  return componentSpec[type].some(
    (output) => output.name === newName && output.name !== currentOutputName,
  );
};
