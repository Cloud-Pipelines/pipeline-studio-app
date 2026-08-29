import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import { useNotices } from "@/hooks/useNotices";

export const NoticeBanners = () => {
  const { notices, dismiss } = useNotices();

  if (notices.length === 0) return null;

  return (
    <div
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
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
