import { useEffect } from "react";

import { BannerCard } from "@/components/shared/Banners/BannerCard";
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
import { closeBannerInbox, useBannerInbox } from "@/hooks/useBannerInbox";
import { tracking } from "@/utils/tracking";

const VIEWPORT_GUTTER = 16;

export const BannerInbox = () => {
  const {
    banners,
    unreadCount,
    isStripHidden,
    isOpen,
    setOpen,
    hideStrip,
    showStrip,
    dismiss,
  } = useBannerInbox();

  useEffect(() => closeBannerInbox, []);

  if (banners.length === 0) return null;

  const label =
    unreadCount > 0
      ? `Notices, ${unreadCount} unread`
      : `Notices, ${banners.length} active`;

  const stripToggle = isStripHidden
    ? ({
        icon: "Eye",
        label: "Show notices",
        onClick: showStrip,
        testId: "banner-inbox-show",
      } as const)
    : ({
        icon: "EyeOff",
        label: "Hide notices",
        onClick: hideStrip,
        testId: "banner-inbox-hide",
      } as const);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltip="Notices"
          variant="header"
          className="relative"
          aria-label={label}
          data-testid="banner-inbox-trigger"
          {...tracking("header.notices")}
        >
          <Icon name="Megaphone" />
          {unreadCount > 0 && (
            <Badge
              size="xs"
              shape="rounded"
              variant="destructive"
              position="topright"
              data-testid="banner-inbox-unread"
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
        data-testid="banner-inbox"
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
              onClick={stripToggle.onClick}
              data-testid={stripToggle.testId}
            >
              <Icon name={stripToggle.icon} size="xs" />
              {stripToggle.label}
            </Button>
          </InlineStack>
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onDismiss={banner.dismissible ? () => dismiss(banner) : undefined}
            />
          ))}
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
};
