import { InlineStack } from "@/components/ui/layout";
import { HoverReveal } from "@/components/ui/patterns/hover-reveal";
import { IconButton } from "@/components/ui/patterns/icon-button";

import { CopyButton } from "./CopyButton";

interface MessageActionsProps {
  content: string;
  onCollapse?: () => void;
}

/** Hover-revealed row of message-level actions (copy, collapse). */
export function MessageActions({ content, onCollapse }: MessageActionsProps) {
  return (
    <HoverReveal>
      <InlineStack gap="0.5" wrap="nowrap">
        <CopyButton content={content} />
        {onCollapse ? (
          <IconButton
            icon="ChevronsDownUp"
            size="xs"
            variant="ghost"
            aria-label="Collapse message"
            onClick={onCollapse}
          />
        ) : null}
      </InlineStack>
    </HoverReveal>
  );
}
