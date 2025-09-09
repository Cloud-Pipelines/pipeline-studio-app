import { useSuspenseQuery } from "@tanstack/react-query";

import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";

export function useAllPublishedComponents() {
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );

  /**
   * API does not provide a way to get all the most recent versions of components.
   * In future as Backend API evolves, we can replace this hook.
   */
  return useSuspenseQuery({
    queryKey: ["component-library", "published", "all-components"],
    staleTime: 1000 * 60 * 5,
    queryFn: () => {
      return publishedComponentsLibrary.getComponents({
        // use a wildcard to bypass the search term validation
        searchTerm: "***",
        filters: ["deprecated"],
      });
    },
  });
}
