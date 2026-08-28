import { AnnouncementMarkdown } from "@/components/shared/AnnouncementMarkdown";
import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { InfoBox } from "@/components/shared/InfoBox";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Heading, Text } from "@/components/ui/typography";
import { getActiveAnnouncements } from "@/config/announcements";
import { tracking } from "@/utils/tracking";

function noticeLabel(count: number): string {
  if (count === 0) return "Notices, none active";
  return `Notices, ${count} active`;
}

export function NoticeCenter() {
  const announcements = getActiveAnnouncements();

  return (
    <Popover>
      <PopoverTrigger asChild {...tracking("header.notices")}>
        <TooltipButton
          tooltip="Notices"
          variant="header"
          className="relative"
          aria-label={noticeLabel(announcements.length)}
        >
          <Icon name="Megaphone" />
          {announcements.length > 0 && (
            <Badge
              size="xs"
              shape="rounded"
              variant="destructive"
              position="topright"
            >
              {announcements.length > 9 ? "9+" : announcements.length}
            </Badge>
          )}
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[calc(100vh-5rem)] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        <BlockStack gap="3">
          <Heading level={3}>Notices</Heading>
          {announcements.length === 0 ? (
            <Text as="span" size="sm" tone="subdued">
              No active notices
            </Text>
          ) : (
            announcements.map((announcement) => (
              <InfoBox
                key={announcement.id}
                title={announcement.title}
                variant={announcement.variant ?? "info"}
                width="full"
              >
                <AnnouncementMarkdown>{announcement.body}</AnnouncementMarkdown>
              </InfoBox>
            ))
          )}
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
}
