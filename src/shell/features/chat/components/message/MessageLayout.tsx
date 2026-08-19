import type { ReactNode } from "react";

import { Box } from "@/components/ui/box";
import { BlockStack, InlineStack } from "@/components/ui/layout";

import {
  ShellMessageBubble,
  type ShellMessageBubbleVariant,
} from "./ShellMessageBubble";

interface MessageLayoutProps {
  /** Sender badge rendered to the left of the bubble (e.g. `MessageAvatar`). */
  avatar: ReactNode;
  /** Row above the bubble (author/label + actions); omit for headerless rows. */
  header?: ReactNode;
  variant: ShellMessageBubbleVariant;
  /** When false, native text selection inside the bubble is disabled. */
  selectable?: boolean;
  children: ReactNode;
}

/**
 * Shared message frame: an avatar aligned to the bottom of a bubble, with an
 * optional header row above it. `group` lets hover-revealed header actions light
 * up on hover of the whole message.
 */
export function MessageLayout({
  avatar,
  header,
  variant,
  selectable,
  children,
}: MessageLayoutProps) {
  return (
    <Box group inlineSize="full">
      <InlineStack gap="2" blockAlign="end" wrap="nowrap">
        {avatar}
        <BlockStack gap="1" align="stretch" grow>
          {header}
          <ShellMessageBubble variant={variant} selectable={selectable}>
            {children}
          </ShellMessageBubble>
        </BlockStack>
      </InlineStack>
    </Box>
  );
}
