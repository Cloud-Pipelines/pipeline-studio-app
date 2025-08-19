import { useSuspenseQuery } from "@tanstack/react-query";

import { hydrateComponentReference } from "@/services/componentService";
import type { ComponentReference } from "@/utils/componentSpec";

const wildcardReference = Symbol("wildcardReference");

/**
 * Hydrate a component reference by fetching the text and spec from the URL or local storage
 * This is experimental function, that potentially can replace all other methods of getting ComponentRef.
 *
 * @param component - The component reference to hydrate
 * @returns The hydrated component reference or null if the component reference is invalid
 */
export function useHydrateComponentReference(component: ComponentReference) {
  /**
   * If the component has a digest or url, we can assume that the component is not going to change frequently
   * Otherwise we dont cache result.
   */
  const staleTime = component.digest || component.url ? 1000 * 60 * 60 * 1 : 0;

  const { data: componentRef } = useSuspenseQuery({
    queryKey: [
      "component",
      "hydrate",
      component.digest ?? component.url ?? wildcardReference,
    ],
    staleTime,
    retryOnMount: true,
    queryFn: () => hydrateComponentReference(component),
  });

  return componentRef;
}
