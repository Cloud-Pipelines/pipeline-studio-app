import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import type { ComponentReference } from "@/utils/componentSpec";

import { ComponentDetailsDialog } from "../Dialogs";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { useHasPublishedComponent } from "./hooks/useHasPublishedComponent";
import { useOutdatedComponents } from "./hooks/useOutdatedComponents";

export const PublishedComponentBadge = withSuspenseWrapper(
  ({ componentRef }: { componentRef: ComponentReference }) => {
    const { data: outdatedComponents } = useOutdatedComponents([componentRef]);
    const { data: isPublished } = useHasPublishedComponent(componentRef);

    const isOutdated = outdatedComponents.length > 0;

    if (!isPublished) {
      return null;
    }

    return (
      <InlineStack className="relative">
        <ComponentDetailsDialog
          displayName={componentRef.name ?? "Details"}
          component={componentRef}
          trigger={
            <Button variant="ghost" size="inline-xs">
              <Icon
                name={isOutdated ? "BookAlert" : "BookCheck"}
                className={cn(
                  isOutdated ? "text-orange-500" : "text-muted-foreground",
                )}
              />
            </Button>
          }
        />
      </InlineStack>
    );
  },
);
