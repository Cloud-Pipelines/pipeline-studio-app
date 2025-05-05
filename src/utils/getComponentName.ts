import type { ComponentReference } from "./componentSpec";

export const getComponentName = (component: ComponentReference): string => {
  return (
    component.spec?.name ||
    component.url?.split("/").pop()?.replace(".yaml", "") ||
    "Component"
  );
};
