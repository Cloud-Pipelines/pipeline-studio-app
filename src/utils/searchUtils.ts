import type { ComponentSpec, InputSpec, OutputSpec } from "./componentSpec";
import { ComponentSearchFilter } from "./constants";

export const normalizeForSearch = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/^["]|["]$/g, "");
};

export const containsSearchTerm = (
  text: string | undefined,
  searchTerm: string,
  exactMatch: boolean = false,
): boolean => {
  if (!text) return false;

  const normalizedText = normalizeForSearch(text);
  const normalizedSearchTerm = normalizeForSearch(searchTerm);

  if (exactMatch) {
    return normalizedText === normalizedSearchTerm;
  }

  return normalizedText.includes(normalizedSearchTerm);
};

export function componentMatchesSearch(
  component: ComponentSpec,
  searchTerm: string,
  filters: string[],
) {
  if (!searchTerm.trim()) return false;

  const exactMatch = filters.includes(ComponentSearchFilter.EXACTMATCH);
  const filterWithoutExactMatch = filters.filter(
    (f) => f !== ComponentSearchFilter.EXACTMATCH,
  );

  return filterWithoutExactMatch.some((filter) =>
    checkSearchFilterComponent(searchTerm, filter, component, exactMatch),
  );
}

function checkSearchFilterComponent(
  searchTerm: string,
  filter: string,
  component: ComponentSpec,
  exactMatch: boolean = false,
): boolean {
  switch (filter) {
    case ComponentSearchFilter.NAME:
      return containsSearchTerm(component.name, searchTerm, exactMatch);

    case ComponentSearchFilter.INPUTNAME:
      return (component.inputs ?? []).some((input: InputSpec) =>
        checkNameMatchesSearch(input.name, searchTerm, exactMatch),
      );

    case ComponentSearchFilter.INPUTTYPE:
      return (component.inputs ?? []).some((input: InputSpec) =>
        containsSearchTerm(JSON.stringify(input.type), searchTerm, exactMatch),
      );

    case ComponentSearchFilter.OUTPUTNAME:
      return (component.outputs ?? []).some((output: OutputSpec) =>
        checkNameMatchesSearch(output.name, searchTerm, exactMatch),
      );

    case ComponentSearchFilter.OUTPUTTYPE:
      return (component.outputs ?? []).some((output: OutputSpec) =>
        containsSearchTerm(JSON.stringify(output.type), searchTerm, exactMatch),
      );

    default:
      return false;
  }
}

/**
 * Checks if variations of a name
 * string matches the search term.
 */
function checkNameMatchesSearch(
  name: string | undefined,
  searchTerm: string,
  exactMatch: boolean = false,
): boolean {
  if (!name) return false;
  return (
    containsSearchTerm(name, searchTerm, exactMatch) ||
    containsSearchTerm(name.replaceAll("_", " "), searchTerm, exactMatch)
  );
}
