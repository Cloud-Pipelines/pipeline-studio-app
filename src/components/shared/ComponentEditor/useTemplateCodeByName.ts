import { useSuspenseQuery } from "@tanstack/react-query";

import { HOURS } from "./constants";
import type { SupportedTemplate } from "./types";

const availableTemplates = import.meta.glob<string>("./templates/*.yaml", {
  query: "?raw",
  import: "default",
});

async function getTemplateCodeByName(name: SupportedTemplate) {
  if (name === "empty") {
    return "";
  }

  return availableTemplates[`./templates/${name}.yaml`]();
}

/**
 * Get the code for a template by name
 *
 * @param name - The name of the template to get the code for
 * @returns
 */
export function useTemplateCodeByName(name: SupportedTemplate) {
  return useSuspenseQuery({
    queryKey: ["template", name],
    queryFn: () => getTemplateCodeByName(name),
    staleTime: 24 * HOURS,
  });
}
