export interface Announcement {
  id: string;
  title: string;
  body: string;
  variant?: "warning" | "info" | "success" | "error";
  dismissible?: boolean;
  expiresAt?: string;
}

declare global {
  interface Window {
    __TANGLE_ANNOUNCEMENTS__?: Announcement[];
  }
}

export function getActiveAnnouncements(now = new Date()): Announcement[] {
  return (window.__TANGLE_ANNOUNCEMENTS__ ?? []).filter(
    (announcement) =>
      !announcement.expiresAt || new Date(announcement.expiresAt) > now,
  );
}
