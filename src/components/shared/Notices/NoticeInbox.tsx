import { useEffect } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/typography";
import { closeNoticeInbox, useNoticeInbox } from "@/hooks/useNoticeInbox";
import { tracking } from "@/utils/tracking";

const VIEWPORT_GUTTER = 16;

function triggerLabel(unreadCount: number, total: number): string {
  if (unreadCount > 0) return `Notices, ${unreadCount} unread`;
  if (total > 0) return `Notices, ${total} active`;
  return "Notices, none";
}

export const NoticeInbox = () => {
  const { notices, unreadCount, isOpen, setOpen, dismiss } = useNoticeInbox();

  useEffect(() => closeNoticeInbox, []);

  const label = triggerLabel(unreadCount, notices.length);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Notices"
          variant="header"
          className="relative"
          aria-label={label}
          data-testid="notice-inbox-trigger"
          {...tracking("header.notices")}
        >
          <Icon name="Megaphone" />
          {unreadCount > 0 && (
            <Badge
              size="xs"
              shape="rounded"
              variant="destructive"
              position="topright"
              data-testid="notice-inbox-unread"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={VIEWPORT_GUTTER}
        className="w-96"
        data-testid="notice-inbox"
      >
        <BlockStack gap="3">
          <Text as="span" size="sm" weight="semibold">
            Notices
          </Text>
          {notices.length === 0 ? (
            <Text
              as="span"
              size="sm"
              tone="subdued"
              data-testid="notice-inbox-empty"
            >
              No notices
            </Text>
          ) : (
            notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onDismiss={
                  notice.dismissible ? () => dismiss(notice) : undefined
                }
              />
            ))
          )}
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
};
