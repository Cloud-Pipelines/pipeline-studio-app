import { Home } from "lucide-react";
import { Fragment } from "react";

import { ShareSubgraphButton } from "@/components/shared/ShareSubgraphButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { InlineStack } from "@/components/ui/layout";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const SubgraphBreadcrumbs = () => {
  const { currentSubgraphPath, navigateToPath } = useComponentSpec();

  // Don't show breadcrumbs if we're at root
  if (currentSubgraphPath.length <= 1) {
    return null;
  }

  return (
    <InlineStack
      align="space-between"
      blockAlign="center"
      gap="0"
      className="px-4 py-2 bg-gray-50 border-b w-full z-1"
    >
      <Breadcrumb>
        <BreadcrumbList>
          {currentSubgraphPath.map((pathSegment, index) => {
            const isLast = index === currentSubgraphPath.length - 1;
            const isRoot = index === 0;

            return (
              <Fragment key={`${pathSegment}-${index}`}>
                <BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbLink asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigateToPath(
                            currentSubgraphPath.slice(0, index + 1),
                          )
                        }
                        className="h-6 px-2"
                      >
                        {isRoot ? (
                          <InlineStack
                            align="start"
                            blockAlign="center"
                            gap="1"
                          >
                            <Home className="w-3 h-3" />
                            Root
                          </InlineStack>
                        ) : (
                          pathSegment
                        )}
                      </Button>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>
                      {isRoot ? (
                        <InlineStack align="start" blockAlign="center" gap="1">
                          <Home className="w-3 h-3" />
                          Root
                        </InlineStack>
                      ) : (
                        pathSegment
                      )}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <InlineStack gap="2" blockAlign="center">
        <div className="text-xs text-gray-500">
          {currentSubgraphPath.length - 1} level
          {currentSubgraphPath.length - 1 !== 1 ? "s" : ""} deep
        </div>
        <ShareSubgraphButton />
      </InlineStack>
    </InlineStack>
  );
};
