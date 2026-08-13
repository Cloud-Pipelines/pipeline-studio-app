import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Heading, Paragraph } from "@/components/ui/typography";
import { useSessionStatus } from "@/shell/features/sessions/model/sessionStatusContext";
import { SESSION_STATUS_DISPLAY } from "@/shell/features/sessions/model/sessionStatusDisplay";
import { truncateMiddle } from "@/shell/lib/utils";

import { StatusDot } from "../StatusDot";
import { SessionDropDownSwitcher } from "./SessionDropDownSwitcher";

interface SessionCardProps {
  currentSessionId: string;
  name: string;
  rootPath?: string;
  connected: boolean;
}

/**
 * Top-level header of the session sidebar: the session name with its live run
 * status and the working directory it is rooted at. Acts as the parent that the
 * agent roster nests under.
 */
export function SessionCard({
  currentSessionId,
  name,
  rootPath,
  connected,
}: SessionCardProps) {
  // Reflect the real run status (idle/active/busy) from the lobby feed, but fall
  // back to disconnected when this chat's own socket is down.
  const status = useSessionStatus(currentSessionId);
  const variant = connected
    ? SESSION_STATUS_DISPLAY[status].variant
    : "disconnected";

  return (
    <Box
      paddingInline="base"
      paddingBlock="sm"
      borderBlockEnd="sm"
      borderInlineEnd="sm"
      inlineSize="full"
    >
      <BlockStack gap="0">
        <SessionDropDownSwitcher
          currentSessionId={currentSessionId}
          trigger={
            <Truncating>
              <InlineStack gap="2" blockAlign="center" wrap="nowrap">
                <Icon
                  name="ChevronsLeftRightEllipsis"
                  size="xs"
                  tone="subdued"
                />
                <Truncating>
                  <Heading level={2} size="sm" truncate>
                    {name}
                  </Heading>
                </Truncating>
                <StatusDot variant={variant} />
              </InlineStack>
            </Truncating>
          }
        />
        {rootPath ? (
          <Truncating>
            <Paragraph font="mono" size="xs" tone="subdued" truncate>
              {truncateMiddle(rootPath, 25)}
            </Paragraph>
          </Truncating>
        ) : null}
      </BlockStack>
    </Box>
  );
}
