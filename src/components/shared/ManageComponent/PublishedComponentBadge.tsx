import type { PropsWithChildren } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import type { ComponentReference } from "@/utils/componentSpec";

import { ComponentDetailsDialog } from "../Dialogs";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { useHasPublishedComponent } from "./hooks/useHasPublishedComponent";
import { useOutdatedComponents } from "./hooks/useOutdatedComponents";

function PublishedComponentBadgeSkeleton() {
  /**
   * Display nothing when loading
   */
  return null;
}

export const PublishedComponentBadge = withSuspenseWrapper(
  ({
    children,
    componentRef,
  }: PropsWithChildren<{ componentRef: ComponentReference }>) => {
    const { data: outdatedComponents } = useOutdatedComponents([componentRef]);
    const { data: isPublished } = useHasPublishedComponent(componentRef);

    const isOutdated = outdatedComponents.length > 0;

    return (
      <InlineStack className="relative min-w-20" blockAlign="start">
        <ComponentDetailsDialog
          displayName={componentRef.name ?? "Details"}
          component={componentRef}
          trigger={
            <Button
              variant="ghost"
              size="inline-xs"
              className={cn(
                "p-0.5",
                isOutdated
                  ? "text-orange-500 hover:text-orange-700"
                  : "text-muted-foreground hover:text-gray-800",
              )}
            >
              <InlineStack gap="1">
                <Icon
                  name={isOutdated ? "BookAlert" : "BookCheck"}
                  className={cn(!isPublished && "invisible")}
                />
                {children}
              </InlineStack>
            </Button>
          }
        />
      </InlineStack>
    );
  },
  PublishedComponentBadgeSkeleton,
);
