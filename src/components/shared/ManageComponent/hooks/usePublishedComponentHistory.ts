import { useSuspenseQuery } from "@tanstack/react-query";

import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import {
  type ComponentReference,
  type ComponentReferenceWithDigest,
  type HydratedComponentReference,
  isDiscoverableComponentReference,
} from "@/utils/componentSpec";

import { hasSupersededBy } from "../types";

/**
 * Hook to get the history of a published component
 * @param componentRef - The component reference to get the history of
 * @param userName - The name of the user to get the history for
 * @returns The history of the component
 */
export const usePublishedComponentHistory = (
  componentRef: HydratedComponentReference,
  userName: string,
) => {
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );

  return useSuspenseQuery({
    queryKey: ["component-library", "published", "history", componentRef.name],
    queryFn: async () => {
      const components = await publishedComponentsLibrary.getComponents({
        searchTerm: componentRef.name,
        filters: ["name", "deprecated"],
      });

      /**
       * Assuming that component name never changed
       */
      const history = buildComponentHistory(
        components.components ?? [],
        componentRef,
        userName,
      );

      return history;
    },
  });
};

function buildComponentHistory(
  componentVersions: ComponentReference[],
  component: HydratedComponentReference,
  userName: string,
) {
  const relatedComponents = componentVersions
    .filter((c) => c.name === component.name && c.published_by === userName)
    .filter((c) => isDiscoverableComponentReference(c));

  const index = new Map<string, ComponentReferenceWithDigest>(
    relatedComponents
      .filter((c) => hasSupersededBy(c))
      .map((c) => [c.superseded_by, c]),
  );

  /**
   * [
   *  {a, supersededBy: b}
   *  {b, supersededBy: c}
   *  {c, supersededBy: d}
   * ] => [d, c, b, a]
   */
  const lastList = relatedComponents.filter((c) => !c.superseded_by);

  if (lastList.length !== 1) {
    return [];
  }

  const timeline: ComponentReferenceWithDigest[] = [];

  let current: ComponentReferenceWithDigest | undefined = lastList[0];
  while (current) {
    timeline.unshift(current);
    const predecessor = index.get(current.digest);
    current = predecessor;
  }

  return timeline;
}
