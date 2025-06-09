import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchAndStoreComponentLibrary } from "@/services/componentService";
import type {
  ComponentFolder,
  ComponentLibrary,
  SearchResult,
} from "@/types/componentLibrary";
import {
  fetchUsedComponents,
  fetchUserComponents,
  filterToUniqueByDigest,
  flattenFolders,
  populateComponentRefsFromUrls,
} from "@/utils/componentLibrary";
import { ComponentSearchFilter } from "@/utils/constants";
import { componentMatchesSearch } from "@/utils/searchUtils";

import { useComponentSpec } from "./ComponentSpecProvider";

const DEFAULT_FILTERS = [ComponentSearchFilter.NAME];

type ComponentLibraryContextType = {
  componentLibrary: ComponentLibrary | undefined;
  userComponentsFolder: ComponentFolder | undefined;
  usedComponentsFolder: ComponentFolder;
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  searchFilters: string[];
  searchResult: SearchResult | null;
  highlightSearchResults: boolean;
  refetchLibrary: () => void;
  refetchUserComponents: () => void;
  setSearchTerm: (term: string) => void;
  setSearchFilters: (filters: string[]) => void;
  setHighlightSearchResults: (highlight: boolean) => void;
};

const ComponentLibraryContext = createContext<
  ComponentLibraryContextType | undefined
>(undefined);

export const ComponentLibraryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { graphSpec } = useComponentSpec();

  const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState<string[]>(DEFAULT_FILTERS);
  const [highlightSearchResults, setHighlightSearchResults] = useState(true);

  // Fetch main component library
  const {
    data: rawComponentLibrary,
    isLoading: isLibraryLoading,
    error: libraryError,
    refetch: refetchLibrary,
  } = useQuery({
    queryKey: ["componentLibrary"],
    queryFn: fetchAndStoreComponentLibrary,
  });

  // Fetch user components
  const {
    data: userComponentsFolder,
    isLoading: isUserComponentsLoading,
    error: userComponentsError,
    refetch: refetchUserComponents,
  } = useQuery({
    queryKey: ["userComponents"],
    queryFn: fetchUserComponents,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Fetch "Used in Pipeline" components
  const usedComponentsFolder: ComponentFolder = useMemo(
    () => fetchUsedComponents(graphSpec),
    [graphSpec],
  );

  const searchComponentLibrary = useCallback(
    (search: string, filters: string[]) => {
      if (!search.trim()) return null;

      const result: SearchResult = {
        components: {
          standard: [],
          user: [],
          used: [],
        },
      };

      if (componentLibrary) {
        const uniqueComponents = filterToUniqueByDigest(
          flattenFolders(componentLibrary),
        );

        result.components.standard = uniqueComponents.filter(
          (c) => c.spec && componentMatchesSearch(c.spec, search, filters),
        );
      }

      if (userComponentsFolder) {
        const uniqueComponents = filterToUniqueByDigest(
          flattenFolders(userComponentsFolder),
        );
        result.components.user = uniqueComponents.filter(
          (c) => c.spec && componentMatchesSearch(c.spec, search, filters),
        );
      }

      if (usedComponentsFolder) {
        const uniqueComponents = filterToUniqueByDigest(
          flattenFolders(usedComponentsFolder),
        );
        result.components.used = uniqueComponents.filter(
          (c) => c.spec && componentMatchesSearch(c.spec, search, filters),
        );
      }

      return result;
    },
    [componentLibrary, userComponentsFolder, usedComponentsFolder],
  );

  const searchResult = useMemo(
    () => searchComponentLibrary(searchTerm, searchFilters),
    [searchTerm, searchFilters, searchComponentLibrary],
  );

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchFilters(DEFAULT_FILTERS);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!rawComponentLibrary) {
      setComponentLibrary(undefined);
      return;
    }
    populateComponentRefsFromUrls(rawComponentLibrary).then((result) => {
      setComponentLibrary(result);
    });
  }, [rawComponentLibrary]);

  const isLoading = isLibraryLoading || isUserComponentsLoading;
  const error = libraryError || userComponentsError;

  const value = useMemo(
    () => ({
      componentLibrary,
      userComponentsFolder,
      usedComponentsFolder,
      isLoading,
      error,
      searchTerm,
      searchFilters,
      searchResult,
      highlightSearchResults,
      refetchLibrary,
      refetchUserComponents,
      setSearchTerm: setSearchTerm,
      setSearchFilters: setSearchFilters,
      setHighlightSearchResults,
    }),
    [
      componentLibrary,
      userComponentsFolder,
      usedComponentsFolder,
      isLoading,
      error,
      searchTerm,
      searchFilters,
      searchResult,
      highlightSearchResults,
      refetchLibrary,
      refetchUserComponents,
      setSearchTerm,
      setSearchFilters,
      setHighlightSearchResults,
    ],
  );

  return (
    <ComponentLibraryContext.Provider value={value}>
      {children}
    </ComponentLibraryContext.Provider>
  );
};

export const useComponentLibrary = () => {
  const ctx = useContext(ComponentLibraryContext);
  if (!ctx)
    throw new Error(
      "useComponentLibrary must be used within a ComponentLibraryProvider",
    );
  return ctx;
};
