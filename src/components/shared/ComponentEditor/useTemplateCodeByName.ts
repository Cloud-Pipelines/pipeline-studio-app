import { useSuspenseQuery } from "@tanstack/react-query";

const cachedTemplates = new Map<string, Promise<string>>([
  ["empty", Promise.resolve("")],
]);

const availableTemplates = import.meta.glob("./templates/*.yaml", {
  query: "?raw",
  import: "default",
});

async function getTemplateCodeByName(name: string) {
  if (name === "empty") {
    return "";
  }

  return availableTemplates[`./templates/${name}.yaml`]().then(
    (content) => content as unknown as string,
  );
}

/**
 * Get the code for a template by name
 *
 * @param name - The name of the template to get the code for
 * @returns
 */
export function useTemplateCodeByName(name: string) {
  return useSuspenseQuery({
    queryKey: ["template", name],
    queryFn: () => getTemplateCodeByName(name),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
