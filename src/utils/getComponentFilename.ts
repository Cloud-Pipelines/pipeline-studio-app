import type { ComponentSpec } from "./componentSpec";

export const getComponentFilename = (componentSpec: ComponentSpec) => {
  const url = componentSpec?.metadata?.annotations?.canonical_location;
  if (url) {
    const urlParts = url.split("/");
    return urlParts[urlParts.length - 1];
  }
  return "component.yaml";
};
