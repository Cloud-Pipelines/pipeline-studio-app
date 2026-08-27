import { useEffect, useState } from "react";

import { NoticeCard } from "@/components/shared/Notices/NoticeCard";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { useNoticeInbox } from "@/hooks/useNoticeInbox";
import { TOP_NAV_HEIGHT } from "@/utils/constants";
import { CONTENT_OFFSET_VAR } from "@/utils/layout";

function useContentOffset(bannerStrip: HTMLElement | null) {
  useEffect(() => {
    const root = document.documentElement;

    if (!bannerStrip) {
      root.style.removeProperty(CONTENT_OFFSET_VAR);
      return;
    }

    const publishOffset = () => {
      root.style.setProperty(
        CONTENT_OFFSET_VAR,
        `${TOP_NAV_HEIGHT + bannerStrip.offsetHeight}px`,
      );
    };

    publishOffset();
    const observer = new ResizeObserver(publishOffset);
    observer.observe(bannerStrip);

    return () => {
      observer.disconnect();
      root.style.removeProperty(CONTENT_OFFSET_VAR);
    };
  }, [bannerStrip]);
}

export const NoticeBanners = () => {
  const { banners, hide, hideBanners } = useNoticeInbox();
  const [bannerStrip, setBannerStrip] = useState<HTMLElement | null>(null);

  useContentOffset(banners.length > 0 ? bannerStrip : null);

  if (banners.length === 0) return null;

  return (
    <InlineStack
      ref={setBannerStrip}
      gap="3"
      blockAlign="start"
      wrap="nowrap"
      className="border-b border-border px-3 py-3 md:px-4"
      data-testid="notice-banners"
    >
      <InlineStack
        tabIndex={0}
        align="safe-center"
        gap="4"
        blockAlign="start"
        wrap="nowrap"
        className="grow min-w-0 overflow-x-auto overscroll-x-contain"
        data-testid="notice-scroller"
      >
        {banners.map((notice) => (
          <div
            key={notice.id}
            className="w-72 shrink-0 sm:w-80"
            data-testid="notice-card"
          >
            <NoticeCard notice={notice} clampBody onHide={() => hide(notice)} />
          </div>
        ))}
      </InlineStack>
      <InlineStack
        gap="1"
        blockAlign="center"
        wrap="nowrap"
        className="shrink-0"
        data-testid="notice-controls"
      >
        <Button
          variant="ghost"
          size="xs"
          onClick={hideBanners}
          data-testid="notice-hide-banners"
        >
          <Icon name="EyeOff" size="sm" />
          Hide notices
        </Button>
      </InlineStack>
    </InlineStack>
  );
};
