import type { ComponentSpec, InputSpec, OutputSpec } from "./componentSpec";
import { ComponentSearchFilter } from "./constants";

/**
 * Normalizes text for case-insensitive searching
 */
export const normalizeForSearch = (text: string): string => {
  return text.toLowerCase().trim();
};

/**
 * Checks if a search term is contained in text
 * Simple substring match check
 */
export const containsSearchTerm = (
  text: string | undefined,
  searchTerm: string,
): boolean => {
  if (!text) return false;

  const normalizedText = normalizeForSearch(text);
  const normalizedSearchTerm = normalizeForSearch(searchTerm);

  // Just check if the text includes the search term
  return normalizedText.includes(normalizedSearchTerm);
};

/**
 * Checks if a component matches the search term
 * based on the specified filters.
 */
export function componentMatchesSearch(
  component: ComponentSpec,
  searchTerm: string,
  filters: string[],
) {
  if (!searchTerm.trim()) return false;

  function checkFilter(filter: string): boolean {
    switch (filter) {
      case ComponentSearchFilter.NAME:
        return containsSearchTerm(component.name, searchTerm);

      case ComponentSearchFilter.INPUTNAME:
        return (component.inputs ?? []).some(
          (input: InputSpec) =>
            containsSearchTerm(input.name, searchTerm) ||
            containsSearchTerm(input.name.replaceAll("_", " "), searchTerm),
        );

      case ComponentSearchFilter.INPUTTYPE:
        return (component.inputs ?? []).some((input: InputSpec) =>
          containsSearchTerm(JSON.stringify(input.type), searchTerm),
        );

      case ComponentSearchFilter.OUTPUTNAME:
        return (component.outputs ?? []).some(
          (output: OutputSpec) =>
            containsSearchTerm(output.name, searchTerm) ||
            containsSearchTerm(output.name.replaceAll("_", " "), searchTerm),
        );

      case ComponentSearchFilter.OUTPUTTYPE:
        return (component.outputs ?? []).some((output: OutputSpec) =>
          containsSearchTerm(JSON.stringify(output.type), searchTerm),
        );

      default:
        return false;
    }
  }

  return filters.some((filter) => checkFilter(filter));
}
