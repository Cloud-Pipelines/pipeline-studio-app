import { useSuspenseQuery } from "@tanstack/react-query";
import {
  type ChangeEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Text } from "@/components/ui/typography";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider/ComponentLibraryProvider";
import {
  isValidFilterRequest,
  type LibraryFilterRequest,
} from "@/providers/ComponentLibraryProvider/types";
import type { ComponentFolder } from "@/types/componentLibrary";
import { ComponentSearchFilter } from "@/utils/constants";

import { ComponentMarkup } from "./ComponentItem";

/**
 * This file contains all the components for the published components search.
 * TODO: split out the components into smaller files (one file per component)
 */

interface SearchResultsProps {
  searchResult?: ComponentFolder[];
}

interface SearchRequestProps {
  value: string;
  onChange: (searchRequest: LibraryFilterRequest) => void;
}

type ApiSearchFilter = "name" | "author";

interface FilterDescription {
  label: string;
  value: ApiSearchFilter;
}

interface SearchFilterProps {
  availableFilters?: FilterDescription[];
  onFiltersChange: (filters: string[]) => void;
}

const DEFAULT_AVAILABLE_FILTERS: FilterDescription[] = [
  {
    label: "Name",
    value: "name",
  },
  {
    label: "Published By",
    value: "author",
  },
];

const DEFAULT_ACTIVE_FILTERS = ["name"];

const SearchFilter = ({
  availableFilters = DEFAULT_AVAILABLE_FILTERS,
  onFiltersChange,
}: SearchFilterProps) => {
  const activeFilters = useRef(new Set<string>(["name"]));

  const handleCheckboxChange = (filter: string, checked: boolean) => {
    if (checked) {
      activeFilters.current.add(filter);
      onFiltersChange(Array.from(activeFilters.current));
    } else {
      activeFilters.current.delete(filter);
      onFiltersChange(Array.from(activeFilters.current));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <InlineStack align="center" gap="1" className="relative">
          <Button variant="outline" size="icon" className="h-8 w-8 p-0">
            <Icon name="ListFilter" />

            {activeFilters.current.size > 0 ? (
              <Badge size="xs" variant="inform" position="topright">
                {activeFilters.current.size}
              </Badge>
            ) : null}
          </Button>
        </InlineStack>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <BlockStack gap="2">
          <Text size="md">Filter Search</Text>
          <BlockStack gap="1">
            {availableFilters.map(({ label, value }) => {
              return (
                <InlineStack
                  key={value}
                  gap="2"
                  align="start"
                  blockAlign="center"
                >
                  <Checkbox
                    id={value}
                    checked={activeFilters.current.has(value)}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange(value, !!checked)
                    }
                    className="hover:cursor-pointer"
                  />
                  <Label htmlFor={value} className="font-light text-sm">
                    {label}
                  </Label>
                </InlineStack>
              );
            })}
          </BlockStack>
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
};

const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number,
) => {
  let timeout: ReturnType<typeof setTimeout>;

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};

const SearchRequestInput = ({ value, onChange }: SearchRequestProps) => {
  const DEBOUNCE_TIME_MS = 200;

  type SearchRequestAction =
    | { type: "SET_SEARCH_TERM"; payload: string }
    | { type: "SET_FILTERS"; payload: string[] };

  const searchRequestReducer = useCallback(
    (state: LibraryFilterRequest, action: SearchRequestAction) => {
      switch (action.type) {
        case "SET_SEARCH_TERM":
          return { ...state, searchTerm: action.payload };
        case "SET_FILTERS":
          return { ...state, filters: action.payload };
        default:
          return state;
      }
    },
    [],
  );

  const debouncedOnChange = useCallback(
    debounce((searchRequest: LibraryFilterRequest) => {
      onChange(searchRequest);
    }, DEBOUNCE_TIME_MS),
    [onChange],
  );

  const [searchRequest, dispatch] = useReducer(searchRequestReducer, {
    searchTerm: value,
    filters: DEFAULT_ACTIVE_FILTERS,
  });

  useEffect(() => {
    debouncedOnChange(searchRequest);
  }, [searchRequest, debouncedOnChange]);

  const onFiltersChange = useCallback((filters: string[]) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value });
  }, []);

  return (
    <InlineStack align="space-between" gap="2" className="w-full">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 z-10 pointer-events-none">
          <Icon name="Search" size="sm" className="text-gray-400" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              data-testid="search-input"
              placeholder="Search components..."
              className="w-full pl-8 text-sm h-8 focus-visible:ring-gray-400/50"
              value={searchRequest.searchTerm}
              onChange={handleChange}
            />
          </TooltipTrigger>
          <TooltipContent>Search components - min 3 characters</TooltipContent>
        </Tooltip>
      </div>
      <SearchFilter onFiltersChange={onFiltersChange} />
    </InlineStack>
  );
};

const SearchResults = ({ searchResult }: SearchResultsProps) => {
  if (!searchResult) {
    return null;
  }

  const totalResults = searchResult.reduce(
    (acc, curr) => acc + (curr.components?.length ?? 0),
    0,
  );

  return (
    <BlockStack gap="2" className="px-2" data-testid="search-results-container">
      <Text
        tone="subdued"
        data-testid="search-results-header"
      >{`Search Results (${totalResults})`}</Text>
      <Separator />
      {totalResults > 0 ? (
        searchResult.map((folder) => (
          <BlockStack key={folder.name}>
            {folder.components && folder.components.length > 0 ? (
              <>
                {searchResult.length > 1 ? (
                  <Text tone="subdued" size="xs">
                    {folder.name}
                  </Text>
                ) : null}
                {folder.components.map((component) => (
                  <ComponentMarkup
                    key={component.digest}
                    component={component}
                  />
                ))}
              </>
            ) : null}
          </BlockStack>
        ))
      ) : (
        <Text tone="subdued">No results found</Text>
      )}
    </BlockStack>
  );
};

const SearchResultsSkeleton = () => {
  return (
    <BlockStack gap="2" className="px-2">
      <InlineStack align="start" gap="1" blockAlign="center">
        <Text tone="subdued">Search Results </Text>
        <Spinner />
      </InlineStack>

      <BlockStack>
        <BlockStack gap="2">
          <Skeleton size="lg" className="h-4 w-full" />
          <Skeleton size="sm" className="h-4 w-full" />
          <Skeleton size="lg" className="h-4 w-full" />
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
};

const Search = withSuspenseWrapper(
  ({ searchRequest }: { searchRequest: LibraryFilterRequest }) => {
    const { backendUrl } = useBackend();
    const { getComponentLibrary, searchComponentLibrary } =
      useComponentLibrary();
    const publishedComponentsLibrary = getComponentLibrary(
      "published_components",
    );

    const { data } = useSuspenseQuery({
      queryKey: ["componentLibrary", "publishedComponents", searchRequest],
      staleTime: 1000 * 60 * 5, // 5 minutes
      queryFn: async () => {
        const remoteSearchResult =
          await publishedComponentsLibrary.getComponents(searchRequest);

        const staticSearchResult = isValidFilterRequest(searchRequest, {
          includesFilter: "name",
        })
          ? searchComponentLibrary(searchRequest.searchTerm, [
              ComponentSearchFilter.NAME,
            ])
          : null;

        const { used: usedComponentResult, user: userComponentResult } =
          staticSearchResult?.components ?? {};

        const result: ComponentFolder[] = [];

        if (
          remoteSearchResult.components &&
          remoteSearchResult.components.length > 0
        ) {
          result.push({
            name: "Library Components",
            // normalize the components to the ComponentReference type
            components: remoteSearchResult.components.map((component) => ({
              digest: component.digest,
              name: component.name,
              // todo: revisit?
              url:
                component.url ??
                `${backendUrl}/api/components/${component.digest}`,
              published_by: component.published_by,
            })),
          });
        }

        if (usedComponentResult && usedComponentResult.length > 0) {
          result.push({
            name: "Used in Pipeline",
            components: usedComponentResult,
          });
        }

        if (userComponentResult && userComponentResult.length > 0) {
          result.push({
            name: "User Components",
            components: userComponentResult,
          });
        }

        return result;
      },
    });

    if (data) {
      return (
        <BlockStack>
          <SearchResults searchResult={data} />
        </BlockStack>
      );
    }

    return <BlockStack>No results found</BlockStack>;
  },
  SearchResultsSkeleton,
);

const MIN_SEARCH_TERM_LENGTH = 3;

function isSearchRequestValid(searchRequest: LibraryFilterRequest | undefined) {
  return isValidFilterRequest(searchRequest, {
    minLength: MIN_SEARCH_TERM_LENGTH,
  });
}

const PublishedComponentsSearch = ({ children }: PropsWithChildren) => {
  const [searchRequest, setSearchRequest] = useState<
    LibraryFilterRequest | undefined
  >();

  const handleSearchRequestChange = useCallback(
    (searchRequest: LibraryFilterRequest) => {
      setSearchRequest(searchRequest);
    },
    [setSearchRequest],
  );

  return (
    <BlockStack gap="2">
      <BlockStack className="px-2 py-1">
        <SearchRequestInput value={""} onChange={handleSearchRequestChange} />
      </BlockStack>
      {isSearchRequestValid(searchRequest) ? (
        <Search searchRequest={searchRequest} />
      ) : (
        children
      )}
    </BlockStack>
  );
};

export default PublishedComponentsSearch;
