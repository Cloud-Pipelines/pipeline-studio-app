import { useEffect, useState } from "react";

import { BannerCard } from "@/components/shared/Banners/BannerCard";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { useBannerInbox } from "@/hooks/useBannerInbox";
import { TOP_NAV_HEIGHT } from "@/utils/constants";
import { CONTENT_OFFSET_VAR } from "@/utils/layout";

function useContentOffset(strip: HTMLElement | null) {
  useEffect(() => {
    const root = document.documentElement;

    if (!strip) {
      root.style.removeProperty(CONTENT_OFFSET_VAR);
      return;
    }

    const publishOffset = () => {
      root.style.setProperty(
        CONTENT_OFFSET_VAR,
        `${TOP_NAV_HEIGHT + strip.offsetHeight}px`,
      );
    };

    publishOffset();
    const observer = new ResizeObserver(publishOffset);
    observer.observe(strip);

    return () => {
      observer.disconnect();
      root.style.removeProperty(CONTENT_OFFSET_VAR);
    };
  }, [strip]);
}

export const BannerRegion = () => {
  const { showing, hideStrip } = useBannerInbox();
  const [strip, setStrip] = useState<HTMLElement | null>(null);

  useContentOffset(showing.length > 0 ? strip : null);

  if (showing.length === 0) return null;

  return (
    <InlineStack
      ref={setStrip}
      gap="3"
      blockAlign="start"
      wrap="nowrap"
      className="border-b border-border px-3 py-3 md:px-4"
      data-testid="banner-region"
    >
      <InlineStack
        tabIndex={0}
        align="safe-center"
        gap="4"
        blockAlign="start"
        wrap="nowrap"
        className="grow min-w-0 overflow-x-auto overscroll-x-contain"
        data-testid="banner-scroller"
      >
        {showing.map((banner) => (
          <div
            key={banner.id}
            className="w-72 shrink-0 sm:w-80"
            data-testid="banner-card"
          >
            <BannerCard
              banner={banner}
              bodyClassName="max-h-32 overflow-y-auto text-pretty"
            />
          </div>
        ))}
      </InlineStack>
      <InlineStack
        gap="1"
        blockAlign="center"
        wrap="nowrap"
        className="shrink-0"
        data-testid="banner-controls"
      >
        <Button
          variant="ghost"
          size="xs"
          onClick={hideStrip}
          data-testid="banner-hide-strip"
        >
          <Icon name="EyeOff" size="sm" />
          Hide notices
        </Button>
      </InlineStack>
    </InlineStack>
  );
};
