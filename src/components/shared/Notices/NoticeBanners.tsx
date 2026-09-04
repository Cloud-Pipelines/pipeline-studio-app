import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import { useHiddenNotices } from "@/hooks/useHiddenNotices";
import { useNotices } from "@/hooks/useNotices";

export const NoticeBanners = () => {
  const { notices } = useNotices();
  const { hiddenIds, hide } = useHiddenNotices();

  const banners = notices.filter((notice) => !hiddenIds.has(notice.id));

  if (banners.length === 0) return null;

  return (
    <div
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
      data-testid="notice-banners"
    >
      {banners.map((notice) => (
        <NoticeCard
          key={notice.id}
          notice={notice}
          clampBody
          onHide={() => hide(notice)}
        />
      ))}
    </div>
  );
};
