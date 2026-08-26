import { useEffect } from "react";

import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/typography";
import { closeNoticeInbox, useNoticeInbox } from "@/hooks/useNoticeInbox";
import { tracking } from "@/utils/tracking";

const VIEWPORT_GUTTER = 16;

export const NoticeInbox = () => {
  const {
    notices,
    unreadCount,
    isStripHidden,
    isOpen,
    setOpen,
    hideBanners,
    showBanners,
    dismiss,
  } = useNoticeInbox();

  useEffect(() => closeNoticeInbox, []);

  if (notices.length === 0) return null;

  const label =
    unreadCount > 0
      ? `Notices, ${unreadCount} unread`
      : `Notices, ${notices.length} active`;

  const bannerToggle = isStripHidden
    ? ({
        icon: "Eye",
        label: "Show notices",
        onClick: showBanners,
        testId: "notice-inbox-show",
      } as const)
    : ({
        icon: "EyeOff",
        label: "Hide notices",
        onClick: hideBanners,
        testId: "notice-inbox-hide",
      } as const);

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
              {unreadCount}
            </Badge>
          )}
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={VIEWPORT_GUTTER}
        className="w-96 max-w-(--radix-popover-content-available-width) max-h-(--radix-popover-content-available-height) overflow-y-auto"
        data-testid="notice-inbox"
      >
        <BlockStack gap="3">
          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="2"
            className="w-full"
          >
            <Text as="span" size="sm" weight="semibold">
              Notices
            </Text>
            <Button
              variant="link"
              size="inline-xs"
              onClick={bannerToggle.onClick}
              data-testid={bannerToggle.testId}
            >
              <Icon name={bannerToggle.icon} size="xs" />
              {bannerToggle.label}
            </Button>
          </InlineStack>
          {notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onDismiss={notice.dismissible ? () => dismiss(notice) : undefined}
            />
          ))}
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
};
