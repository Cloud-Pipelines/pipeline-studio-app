import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  generateDigest,
  parseComponentData,
} from "@/services/componentService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { ComponentSearchFilter } from "@/utils/constants";
import {
  getAllComponents,
  getAllUserComponents,
  type UserComponent,
} from "@/utils/localforge";
import { containsSearchTerm } from "@/utils/searchUtils";

import { ComponentMarkup } from "./ComponentItem";

interface SearchResultsProps {
  searchTerm: string;
  searchFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

interface ComponentData {
  digest: string;
  url: string;
  data: ComponentSpec;
}

const SearchResults = ({
  searchTerm,
  searchFilters,
  onFiltersChange,
}: SearchResultsProps) => {
  const [matchedComponents, setMatchedComponents] = useState<ComponentData[]>(
    [],
  );
  const [matchedUserComponents, setMatchedUserComponents] = useState<
    ComponentData[]
  >([]);

  const { data: components, isLoading } = useQuery({
    queryKey: ["get-all-components"],
    queryFn: getAllComponents,
  });

  const { data: userComponents, isLoading: isLoadingUserComponents } = useQuery(
    {
      queryKey: ["get-all-user-components"],
      queryFn: getAllUserComponents,
    },
  );

  const handleNameFilterClick = useCallback(() => {
    if (!searchFilters.includes(ComponentSearchFilter.NAME)) {
      onFiltersChange([...searchFilters, ComponentSearchFilter.NAME]);
    }
  }, [searchFilters, onFiltersChange]);

  const verifySearchFilterMatch = useCallback(
    (component: ComponentSpec | UserComponent) => {
      if (searchFilters.length === 0) return false;

      let componentSpec: ComponentSpec | undefined;
      if ("componentRef" in component) {
        componentSpec = component.componentRef.spec;
      } else {
        componentSpec = component;
      }

      if (!componentSpec) return false;
      const filterChecks: Record<string, () => boolean> = {
        [ComponentSearchFilter.NAME]: () =>
          containsSearchTerm(componentSpec.name || "", searchTerm),
        [ComponentSearchFilter.INPUTNAME]: () => {
          const inputNames =
            componentSpec.inputs?.map((input) => input.name) || [];
          const inputNamesWithSpaces = inputNames.map((n) =>
            n.replaceAll("_", " "),
          );
          return (
            containsSearchTerm(inputNames.join(" | "), searchTerm) ||
            containsSearchTerm(inputNamesWithSpaces.join(" | "), searchTerm)
          );
        },
        [ComponentSearchFilter.INPUTTYPE]: () => {
          const inputTypes =
            componentSpec.inputs?.map((input) => input.type) || [];
          return containsSearchTerm(inputTypes.join(" | "), searchTerm);
        },
        [ComponentSearchFilter.OUTPUTNAME]: () => {
          const outputNames =
            componentSpec.outputs?.map((output) => output.name) || [];
          const outputNamesWithSpaces = outputNames.map((n) =>
            n.replaceAll("_", " "),
          );
          return (
            containsSearchTerm(outputNames.join(" | "), searchTerm) ||
            containsSearchTerm(outputNamesWithSpaces.join(" | "), searchTerm)
          );
        },
        [ComponentSearchFilter.OUTPUTTYPE]: () => {
          const outputTypes =
            componentSpec.outputs?.map((output) => output.type) || [];
          return containsSearchTerm(outputTypes.join(" | "), searchTerm);
        },
      };

      return searchFilters.some((filter) => filterChecks[filter]?.() === true);
    },
    [searchFilters, searchTerm],
  );

  useEffect(() => {
    if (!components) return;

    const fetchMatchedComponents = async () => {
      const results: ComponentData[] = [];

      for (const component of components) {
        const parsedSpec = parseComponentData(component.data);
        if (!parsedSpec) continue;

        const matchFound = verifySearchFilterMatch(parsedSpec);

        if (matchFound) {
          const digest = await generateDigest(component.data);

          if (results.some((r) => r.digest === digest)) {
            continue;
          }

          results.push({
            digest,
            url: component.url,
            data: {
              ...parsedSpec,
              name: parsedSpec.name || "Unnamed Component",
            },
          });
        }
      }

      setMatchedComponents(results);
    };

    fetchMatchedComponents();
  }, [components, verifySearchFilterMatch]);

  useEffect(() => {
    if (!userComponents) return;

    const fetchMatchedUserComponents = async () => {
      const results: ComponentData[] = [];

      for (const userComponent of userComponents) {
        const matchFound = verifySearchFilterMatch(userComponent);
        if (matchFound) {
          results.push({
            digest: userComponent.componentRef.digest || "",
            url: userComponent.componentRef.url || "",
            data: userComponent.componentRef.spec || {
              name: userComponent.name,
              implementation: {
                graph: {
                  tasks: {},
                },
              },
            },
          });
        }
      }

      setMatchedUserComponents(results);
    };

    fetchMatchedUserComponents();
  }, [userComponents, verifySearchFilterMatch]);

  if (isLoading || isLoadingUserComponents) return <div>Loading...</div>;

  if (searchFilters.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        No search filters set.{" "}
        <Button
          variant="ghost"
          onClick={handleNameFilterClick}
          className="text-sky-500 hover:text-sky-600 focus:text-sky-600 active:text-sky-700"
        >
          Filter by name
        </Button>
      </div>
    );
  }

  const hasResults =
    matchedComponents.length > 0 || matchedUserComponents.length > 0;
  if (!hasResults) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        No component {searchFilters.join(" or ")} matching &ldquo;{searchTerm}
        &rdquo;
      </div>
    );
  }

  const totalResults = matchedComponents.length + matchedUserComponents.length;

  return (
    <div className="py-2">
      <div className="px-4 pb-2 text-sm font-medium text-gray-600 border-b">
        Search Results ({totalResults})
      </div>
      <div className="mt-1">
        {matchedUserComponents.length > 0 && (
          <>
            {/* User component section header if both types exist */}
            {matchedComponents.length > 0 && (
              <div className="px-4 py-1 text-xs font-medium text-gray-500">
                User Components
              </div>
            )}
            {/* User component results */}
            {matchedUserComponents.map((component, index) => (
              <ComponentMarkup
                key={`user-${index}`}
                url={component.url}
                componentSpec={component.data}
                componentDigest={component.digest}
                componentText={JSON.stringify(component.data)}
                displayName={component.data.name!}
              />
            ))}
          </>
        )}

        {matchedComponents.length > 0 && (
          <>
            {/* Library component section header if both types exist */}
            {matchedUserComponents.length > 0 && (
              <div className="px-4 py-1 mt-2 text-xs font-medium text-gray-500">
                Library Components
              </div>
            )}
            {/* Library component results */}
            {matchedComponents.map((component, index) => (
              <ComponentMarkup
                key={`lib-${index}`}
                url={component.url}
                componentSpec={component.data}
                componentDigest={component.digest}
                componentText={JSON.stringify(component.data)}
                displayName={component.data.name!}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
