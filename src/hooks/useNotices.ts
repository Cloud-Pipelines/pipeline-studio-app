import { useEffect, useSyncExternalStore } from "react";

import {
  getNoticesSnapshot,
  refreshNotices,
  subscribeToNotices,
  type TangleNotice,
} from "@/config/notices";

const MIN_REFRESH_INTERVAL_MS = 30_000;

let isRefreshWatcherStarted = false;
let lastRefreshAt = 0;

function refreshIfStale() {
  const now = Date.now();
  if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;

  lastRefreshAt = now;
  refreshNotices();
}

function startRefreshWatcher() {
  if (isRefreshWatcherStarted) return;
  isRefreshWatcherStarted = true;

  refreshIfStale();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshIfStale();
  });
}

export function resetNoticeRefreshForTests(): void {
  isRefreshWatcherStarted = false;
  lastRefreshAt = 0;
}

export function useNotices(): readonly TangleNotice[] {
  const notices = useSyncExternalStore(subscribeToNotices, getNoticesSnapshot);

  useEffect(startRefreshWatcher, []);

  return notices;
}
