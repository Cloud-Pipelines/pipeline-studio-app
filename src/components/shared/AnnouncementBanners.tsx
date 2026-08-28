import { useState } from "react";

import { AnnouncementMarkdown } from "@/components/shared/AnnouncementMarkdown";
import { InfoBox } from "@/components/shared/InfoBox";
import { BlockStack } from "@/components/ui/layout";
import { getActiveAnnouncements } from "@/config/announcements";
import { getStorage } from "@/utils/typedStorage";

interface DismissedAnnouncementsStorage {
  "dismissed-announcements": string[];
}

const storage = getStorage<
  keyof DismissedAnnouncementsStorage,
  DismissedAnnouncementsStorage
>();

function getDismissedIds(): string[] {
  return storage.getItem("dismissed-announcements") ?? [];
}

export const AnnouncementBanners = () => {
  const [dismissedIds, setDismissedIds] = useState(getDismissedIds);
  const announcements = getActiveAnnouncements().filter(
    (announcement) => !dismissedIds.includes(announcement.id),
  );

  if (announcements.length === 0) {
    return null;
  }

  const dismiss = (id: string) => {
    const nextDismissedIds = [...dismissedIds, id];
    storage.setItem("dismissed-announcements", nextDismissedIds);
    setDismissedIds(nextDismissedIds);
  };

  return (
    <BlockStack gap="2">
      {announcements.map((announcement) => (
        <InfoBox
          key={announcement.id}
          title={announcement.title}
          variant={announcement.variant ?? "info"}
          width="full"
          onDismiss={
            announcement.dismissible
              ? () => dismiss(announcement.id)
              : undefined
          }
        >
          <AnnouncementMarkdown>{announcement.body}</AnnouncementMarkdown>
        </InfoBox>
      ))}
    </BlockStack>
  );
};
