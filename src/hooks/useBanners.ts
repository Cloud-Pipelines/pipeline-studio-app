import { useEffect, useSyncExternalStore } from "react";

import {
  getBannersSnapshot,
  refreshBanners,
  subscribeToBanners,
  type TangleBanner,
} from "@/config/banners";

const MIN_REFRESH_INTERVAL_MS = 30_000;

let isRefreshWatcherStarted = false;
let lastRefreshAt = 0;

function refreshIfStale() {
  const now = Date.now();
  if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;

  lastRefreshAt = now;
  refreshBanners();
}

function startRefreshWatcher() {
  if (isRefreshWatcherStarted) return;
  isRefreshWatcherStarted = true;

  refreshIfStale();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshIfStale();
  });
}

export function resetBannerRefreshForTests(): void {
  isRefreshWatcherStarted = false;
  lastRefreshAt = 0;
}

export function useBanners(): readonly TangleBanner[] {
  const banners = useSyncExternalStore(subscribeToBanners, getBannersSnapshot);

  useEffect(startRefreshWatcher, []);

  return banners;
}
