import { useEffect, useSyncExternalStore } from "react";

import {
  getNoticesSnapshot,
  refreshNotices,
  resetNoticeCacheForTests,
  subscribeToNotices,
  type TangleNotice,
} from "@/config/notices";
import { getStorage } from "@/utils/typedStorage";

const DISMISSED_KEY = "dismissed-notices";
const MIN_REFRESH_INTERVAL_MS = 30_000;

const storage = getStorage<
  typeof DISMISSED_KEY,
  Record<typeof DISMISSED_KEY, string[]>
>();

const PROMOTION_ORDER: Record<TangleNotice["variant"], number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
};

const dismissedForThisSession = new Set<string>();

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

let revision = 0;
const listeners = new Set<() => void>();

function publish() {
  revision += 1;
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent) {
  // typedStorage re-dispatches a synthetic same-tab event on every write, which
  // arrives without a storageArea. Those writes already publish themselves.
  if (event.storageArea === null) return;
  if (event.key === DISMISSED_KEY) publish();
}

function subscribeToDismissals(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("storage", handleStorage);
  };
}

function getRevision(): number {
  return revision;
}

function readDismissedIds(): string[] {
  const stored = storage.getItem(DISMISSED_KEY);
  return Array.isArray(stored) ? stored : [];
}

let cachedDismissed: Set<string> | null = null;
let cachedRevision = -1;

function getDismissedIds(revision: number): Set<string> {
  if (cachedDismissed && cachedRevision === revision) return cachedDismissed;

  cachedRevision = revision;
  cachedDismissed = new Set([
    ...readDismissedIds(),
    ...dismissedForThisSession,
  ]);

  return cachedDismissed;
}

function dismissNotice(notice: TangleNotice) {
  if (notice.dismissible) {
    const stored = readDismissedIds();
    if (!stored.includes(notice.id))
      storage.setItem(DISMISSED_KEY, [...stored, notice.id]);
  }

  if (!readDismissedIds().includes(notice.id))
    dismissedForThisSession.add(notice.id);

  publish();
}

export function resetNoticeStateForTests(): void {
  resetNoticeCacheForTests();
  isRefreshWatcherStarted = false;
  lastRefreshAt = 0;
  dismissedForThisSession.clear();
  cachedDismissed = null;
  cachedRevision = -1;
}

export interface Notices {
  notices: readonly TangleNotice[];
  dismiss: (notice: TangleNotice) => void;
}

export function useNotices(): Notices {
  const published = useSyncExternalStore(
    subscribeToNotices,
    getNoticesSnapshot,
  );
  const revision = useSyncExternalStore(subscribeToDismissals, getRevision);
  const dismissedIds = getDismissedIds(revision);

  useEffect(startRefreshWatcher, []);

  return {
    notices: published
      .filter((notice) => !dismissedIds.has(notice.id))
      .sort((a, b) => PROMOTION_ORDER[a.variant] - PROMOTION_ORDER[b.variant]),
    dismiss: dismissNotice,
  };
}
