import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { pluralize } from "@/utils/string";
import { tracking } from "@/utils/tracking";

interface FloatingSelectionBarProps {
  count: number;
  itemNoun: string;
  onClear: () => void;
  clearTrackingId?: string;
  children: ReactNode;
}

/**
 * The bar that floats over a table while rows are selected. Three tables grew
 * their own copy of the same shell, so it lives here — the positioning, the
 * "N selected" count and the clear button are identical everywhere, and only
 * the actions differ.
 */
export function FloatingSelectionBar({
  count,
  itemNoun,
  onClear,
  clearTrackingId,
  children,
}: FloatingSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-background p-4 shadow-lg">
      <InlineStack gap="4" blockAlign="center">
        <Text size="sm" weight="semibold">
          {count} {pluralize(count, itemNoun)} selected
        </Text>
        <InlineStack gap="2" blockAlign="center">
          {children}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Clear selection"
            {...(clearTrackingId ? tracking(clearTrackingId) : {})}
          >
            <Icon name="X" />
          </Button>
        </InlineStack>
      </InlineStack>
    </div>
  );
}
