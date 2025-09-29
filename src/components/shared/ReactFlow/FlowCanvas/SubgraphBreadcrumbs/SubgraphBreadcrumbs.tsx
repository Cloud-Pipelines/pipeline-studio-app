import { ChevronRight, Home } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { InlineStack } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

interface SubgraphBreadcrumbsProps {
  className?: string;
}

export const SubgraphBreadcrumbs = ({
  className,
}: SubgraphBreadcrumbsProps) => {
  const { currentSubgraphPath, navigateToPath } = useComponentSpec();

  const handleNavigateToPath = useCallback(
    (targetIndex: number) => {
      // Navigate to a specific point in the path by slicing the array
      const targetPath = currentSubgraphPath.slice(0, targetIndex + 1);
      navigateToPath(targetPath);
    },
    [currentSubgraphPath, navigateToPath],
  );

  // Don't show breadcrumbs if we're at root
  if (currentSubgraphPath.length <= 1) {
    return null;
  }

  return (
    <InlineStack
      align="space-between"
      blockAlign="center"
      gap="1"
      className={cn(
        "px-4 py-2 bg-gray-50 border-b transition-all duration-200 ease-in-out animate-in fade-in-0 slide-in-from-top-1",
        className,
      )}
    >
      <InlineStack
        align="start"
        blockAlign="center"
        gap="1"
        className="text-sm text-gray-600"
      >
        {currentSubgraphPath.map((pathSegment, index) => {
          const isLast = index === currentSubgraphPath.length - 1;
          const isRoot = index === 0;

          return (
            <InlineStack
              key={`${pathSegment}-${index}`}
              align="start"
              blockAlign="center"
              gap="1"
            >
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateToPath(index)}
                className={cn(
                  "h-6 px-2 text-sm font-medium",
                  isLast
                    ? "text-gray-900 cursor-default hover:bg-transparent"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
                disabled={isLast}
              >
                {isRoot ? (
                  <InlineStack align="start" blockAlign="center" gap="1">
                    <Home className="w-3 h-3" />
                    Root
                  </InlineStack>
                ) : (
                  pathSegment
                )}
              </Button>
            </InlineStack>
          );
        })}
      </InlineStack>

      <div className="text-xs text-gray-500">
        {currentSubgraphPath.length - 1} level
        {currentSubgraphPath.length - 1 !== 1 ? "s" : ""} deep
      </div>
    </InlineStack>
  );
};
