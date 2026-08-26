import { useEffect, useSyncExternalStore } from "react";

import {
  getBannersSnapshot,
  refreshBanners,
  subscribeToBanners,
  type TangleBanner,
} from "@/config/banners";

let isRefreshWatcherStarted = false;

function startRefreshWatcher() {
  if (isRefreshWatcherStarted) return;
  isRefreshWatcherStarted = true;

  refreshBanners();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshBanners();
  });
}

export function useBanners(): readonly TangleBanner[] {
  const banners = useSyncExternalStore(subscribeToBanners, getBannersSnapshot);

  useEffect(startRefreshWatcher, []);

  return banners;
}
