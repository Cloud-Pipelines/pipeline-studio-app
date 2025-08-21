import { useHydrateComponentReference } from "@/hooks/useHydrateComponentReference";
import { type ComponentReference } from "@/utils/componentSpec";

import { useCurrentUserDetails } from "./useCurrentUserDetails";
import { usePublishedComponentHistory } from "./usePublishedComponentHistory";

/**
 * Check if the component has an updated version in the published component history
 * @param component - The component reference to check
 * @returns True if the component has an updated version, false otherwise
 */
export const useHasUpdatedVersionOfComponent = (
  component: ComponentReference,
) => {
  const hydratedComponent = useHydrateComponentReference(component);
  const { data: currentUserDetails } = useCurrentUserDetails();
  const { data: history } = usePublishedComponentHistory(
    // todo: fix typing
    hydratedComponent!,
    currentUserDetails.name,
  );

  return (
    history.length > 0 &&
    history[history.length - 1].digest !== component.digest
  );
};
