import type { ReactNode } from "react";

import { Box } from "@/components/ui/box";
import { InlineStack } from "@/components/ui/layout";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Text } from "@/components/ui/typography";

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

/** A labelled detail row in the trigger's definition list. */
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <InlineStack gap="3" wrap="nowrap" blockAlign="start" grow>
      <Box>
        <Text as="dt" size="sm" tone="subdued">
          {label}
        </Text>
      </Box>
      <Truncating>
        <Text as="dd" size="sm">
          {children}
        </Text>
      </Truncating>
    </InlineStack>
  );
}
