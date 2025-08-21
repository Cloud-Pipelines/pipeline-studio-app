import { useSuspenseQuery } from "@tanstack/react-query";

import type { ComponentReference } from "@/utils/componentSpec";

import { useComponentLibrary } from "../ComponentLibraryProvider";

/**
 * Hook to check if a component is published in the published components library
 * @param componentRef - The component reference to check if it is published
 * @returns A boolean indicating if the component is published
 */
export const useHasPublishedComponent = (componentRef: ComponentReference) => {
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );

  return useSuspenseQuery({
    // todo: id of the component?
    // todo: consistent queryKey naming practice
    queryKey: ["has-component", componentRef.digest],
    queryFn: () => publishedComponentsLibrary.hasComponent(componentRef),
  });
};
