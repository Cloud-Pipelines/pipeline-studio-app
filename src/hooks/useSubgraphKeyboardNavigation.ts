import { useEffect } from "react";

import { useComponentSpec } from "@/providers/ComponentSpecProvider";

/**
 * Hook to handle keyboard navigation for subgraphs
 * - Escape: Navigate back to parent subgraph
 */
export const useSubgraphKeyboardNavigation = () => {
  const { canNavigateBack, navigateBack } = useComponentSpec();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if we can navigate back and no input elements are focused
      if (!canNavigateBack) return;

      // Don't interfere with typing in input fields, textareas, or contenteditable elements
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Handle Escape key to go back
      if (event.key === "Escape") {
        event.preventDefault();
        navigateBack();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canNavigateBack, navigateBack]);
};
