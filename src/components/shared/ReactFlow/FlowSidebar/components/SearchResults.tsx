import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { SearchResult } from "@/types/componentLibrary";
import { componentReferenceToComponentData } from "@/utils/componentLibrary";
import { ComponentSearchFilter } from "@/utils/constants";

import { ComponentMarkup } from "./ComponentItem";

interface SearchResultsProps {
  searchResult: SearchResult;
  onFiltersChange: (filters: string[]) => void;
}

const SearchResults = ({
  searchResult,
  onFiltersChange,
}: SearchResultsProps) => {
  const { searchTerm, searchFilters } = useComponentLibrary();

  const matchedComponents = searchResult.components.standard
    .map((c) => componentReferenceToComponentData(c))
    .filter((c) => !!c);

  const matchedUserComponents = searchResult.components.user
    .map((c) => componentReferenceToComponentData(c))
    .filter((c) => !!c);

  const handleNameFilterClick = useCallback(() => {
    if (!searchFilters.includes(ComponentSearchFilter.NAME)) {
      onFiltersChange([...searchFilters, ComponentSearchFilter.NAME]);
    }
  }, [searchFilters, onFiltersChange]);

  const filtersWithoutExactMatch = searchFilters.filter(
    (f) => f !== ComponentSearchFilter.EXACTMATCH,
  );

  const exactMatchFilter = searchFilters.includes(
    ComponentSearchFilter.EXACTMATCH,
  );

  if (filtersWithoutExactMatch.length === 0) {
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
        No component {filtersWithoutExactMatch.join(" or ")}{" "}
        {exactMatchFilter ? "exactly matches" : "contains"} &ldquo;
        {searchTerm}
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
