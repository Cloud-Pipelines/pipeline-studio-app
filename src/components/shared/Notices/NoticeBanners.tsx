import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import { useNoticeInbox } from "@/hooks/useNoticeInbox";

export const NoticeBanners = () => {
  const { notices, dismiss } = useNoticeInbox();

  if (notices.length === 0) return null;

  return (
    <div
      className="w-full grid grid-cols-3 gap-6 items-start"
      data-testid="notice-banners"
    >
      {notices.map((notice) => (
        <NoticeCard
          key={notice.id}
          notice={notice}
          clampBody
          onDismiss={notice.dismissible ? () => dismiss(notice) : undefined}
        />
      ))}
    </div>
  );
};
