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
  fetchFavoriteComponents,
  fetchUsedComponents,
  fetchUserComponents,
  filterToUniqueByDigest,
  flattenFolders,
  populateComponentRefsFromUrls,
} from "@/utils/componentLibrary";
import type { ComponentReference } from "@/utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  updateComponentInListByText,
  updateComponentRefInList,
} from "@/utils/componentStore";
import {
  ComponentSearchFilter,
  USER_COMPONENTS_LIST_NAME,
} from "@/utils/constants";
import { getComponentByUrl, saveComponent } from "@/utils/localforge";
import { componentMatchesSearch } from "@/utils/searchUtils";

import { useComponentSpec } from "./ComponentSpecProvider";

const DEFAULT_FILTERS = [ComponentSearchFilter.NAME];

type ComponentLibraryContextType = {
  componentLibrary: ComponentLibrary | undefined;
  userComponentsFolder: ComponentFolder | undefined;
  usedComponentsFolder: ComponentFolder;
  favoritesFolder: ComponentFolder;
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
  setComponentFavorite: (
    component: ComponentReference,
    favorited: boolean,
  ) => void;
  checkIfFavorited: (component: ComponentReference) => boolean;
  checkIfUserComponent: (component: ComponentReference) => boolean;
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
  const [userComponentsFolder, setUserComponentsFolder] =
    useState<ComponentFolder>();
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
    data: rawUserComponentsFolder,
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

  // Fetch "Starred" components
  const favoritesFolder: ComponentFolder = useMemo(
    () => fetchFavoriteComponents(componentLibrary, userComponentsFolder),
    [componentLibrary, userComponentsFolder],
  );

  // Methods
  const refreshComponentLibrary = useCallback(async () => {
    const { data: updatedLibrary } = await refetchLibrary();

    if (updatedLibrary) {
      populateComponentRefsFromUrls(updatedLibrary).then((result) => {
        setComponentLibrary(result);
      });
    }
  }, [refetchLibrary]);

  const refreshUserComponents = useCallback(async () => {
    const { data: updatedUserComponents } = await refetchUserComponents();

    if (updatedUserComponents) {
      populateComponentRefsFromUrls(updatedUserComponents).then((result) => {
        setUserComponentsFolder(result);
      });
    }
  }, [refetchUserComponents]);

  const setComponentFavorite = useCallback(
    async (component: ComponentReference, favorited: boolean) => {
      // Update via filename (User Components)
      if (!component.url) {
        component.favorited = favorited;

        if (component.spec) {
          await updateComponentRefInList(
            USER_COMPONENTS_LIST_NAME,
            component as ComponentReferenceWithSpec,
            component.name ?? component.spec.name ?? "Unnamed Component",
          ).then(async () => {
            await refreshUserComponents();
          });
        } else if (component.text) {
          await updateComponentInListByText(
            USER_COMPONENTS_LIST_NAME,
            component.text,
            component.name ?? "Unnamed Component",
            { favorited },
          ).then(async () => {
            await refreshUserComponents();
          });
        } else {
          console.warn(
            `Component "${component.name}" does not have spec or text, cannot favorite.`,
          );
        }

        return;
      }

      // Update via url (Standard Components)
      const storedComponent = await getComponentByUrl(component.url);

      if (storedComponent) {
        await saveComponent({
          ...storedComponent,
          favorited,
        }).then(async () => {
          await refreshComponentLibrary();
          await refreshUserComponents();
        });
      }
    },
    [refreshComponentLibrary, refreshUserComponents],
  );

  const checkIfFavorited = useCallback(
    (component: ComponentReference) => {
      if (componentLibrary) {
        const uniqueLibraryComponents = filterToUniqueByDigest(
          flattenFolders(componentLibrary),
        );

        const isFavourited = uniqueLibraryComponents.some(
          (c) => c.digest === component.digest && c.favorited,
        );

        if (isFavourited) {
          return true;
        }
      }

      if (userComponentsFolder) {
        const uniqueUserComponents = filterToUniqueByDigest(
          flattenFolders(userComponentsFolder),
        );

        const isFavourited = uniqueUserComponents.some(
          (c) => c.digest === component.digest && c.favorited,
        );

        if (isFavourited) {
          return true;
        }
      }

      return false;
    },
    [componentLibrary, userComponentsFolder],
  );

  const checkIfUserComponent = useCallback(
    (component: ComponentReference) => {
      if (!userComponentsFolder) return false;

      const uniqueUserComponents = filterToUniqueByDigest(
        flattenFolders(userComponentsFolder),
      );

      return uniqueUserComponents.some((c) => c.digest === component.digest);
    },
    [userComponentsFolder],
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
  }, [searchTerm, searchFilters]);

  useEffect(() => {
    if (!rawComponentLibrary) {
      setComponentLibrary(undefined);
      return;
    }
    populateComponentRefsFromUrls(rawComponentLibrary).then((result) => {
      setComponentLibrary(result);
    });
  }, [rawComponentLibrary]);

  useEffect(() => {
    if (!rawUserComponentsFolder) {
      setUserComponentsFolder(undefined);
      return;
    }
    populateComponentRefsFromUrls(rawUserComponentsFolder).then((result) => {
      setUserComponentsFolder(result);
    });
  }, [rawUserComponentsFolder]);

  const isLoading = isLibraryLoading || isUserComponentsLoading;
  const error = libraryError || userComponentsError;

  const value = useMemo(
    () => ({
      componentLibrary,
      userComponentsFolder,
      usedComponentsFolder,
      favoritesFolder,
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
      setComponentFavorite,
      checkIfFavorited,
      checkIfUserComponent,
    }),
    [
      componentLibrary,
      userComponentsFolder,
      usedComponentsFolder,
      favoritesFolder,
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
      setComponentFavorite,
      checkIfFavorited,
      checkIfUserComponent,
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
