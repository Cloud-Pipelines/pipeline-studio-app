import { useEffect } from "react";

import { useComponentSpec } from "@/providers/ComponentSpecProvider";

/**
 * Hook to handle keyboard navigation for subgraphs
 * - Escape: Navigate back to parent subgraph
 * - Command+Escape (or Ctrl+Escape): Navigate to root
 */
export const useSubgraphKeyboardNavigation = () => {
  const { canNavigateBack, navigateBack, navigateToPath } = useComponentSpec();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

      if (event.key === "Escape") {
        event.preventDefault();

        // Command+Escape (Mac) or Ctrl+Escape (Windows/Linux) navigates to root
        if (event.metaKey || event.ctrlKey) {
          navigateToPath(["root"]);
        } else {
          navigateBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canNavigateBack, navigateBack, navigateToPath]);
};
