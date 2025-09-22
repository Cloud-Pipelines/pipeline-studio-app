import { useQuery } from "@tanstack/react-query";

import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { ComponentReference } from "@/utils/componentSpec";

/**
 * Hook to check if a component is published in the published components library
 * @param componentRef - The component reference to check if it is published
 * @param enabled - Whether the query should be enabled
 * @returns A boolean indicating if the component is published
 */
export const useHasPublishedComponent = (
  componentRef: ComponentReference,
  enabled = true,
) => {
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );

  return useQuery({
    // todo: id of the component?
    // todo: consistent queryKey naming practice
    queryKey: ["has-component", componentRef.digest],
    queryFn: () => publishedComponentsLibrary.hasComponent(componentRef),
    enabled: Boolean(componentRef.digest) && enabled,
  });
};
