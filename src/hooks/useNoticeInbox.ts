import { useSyncExternalStore } from "react";

import { resetNoticeCacheForTests, type TangleNotice } from "@/config/notices";
import { resetNoticeRefreshForTests, useNotices } from "@/hooks/useNotices";
import { getStorage } from "@/utils/typedStorage";

const STORAGE_KEYS = [
  "dismissed-notices",
  "hidden-notices",
  "read-notices",
] as const;

type NoticeInboxKey = (typeof STORAGE_KEYS)[number];

const storage = getStorage<NoticeInboxKey, Record<NoticeInboxKey, string[]>>();

const PROMOTION_ORDER: Record<TangleNotice["variant"], number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
};

const hiddenForThisSession = new Set<string>();
const dismissedForThisSession = new Set<string>();

let isOpen = false;
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
  if (STORAGE_KEYS.some((key) => key === event.key)) publish();
}

function subscribe(listener: () => void): () => void {
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

function readIds(key: NoticeInboxKey): string[] {
  const stored = storage.getItem(key);
  return Array.isArray(stored) ? stored : [];
}

interface InboxState {
  isOpen: boolean;
  dismissedIds: Set<string>;
  hiddenIds: Set<string>;
  readIds: Set<string>;
}

let cachedState: InboxState | null = null;
let cachedRevision = -1;

function getInboxState(revision: number): InboxState {
  if (cachedState && cachedRevision === revision) return cachedState;

  cachedRevision = revision;
  cachedState = {
    isOpen,
    dismissedIds: new Set([
      ...readIds("dismissed-notices"),
      ...dismissedForThisSession,
    ]),
    hiddenIds: new Set([...readIds("hidden-notices"), ...hiddenForThisSession]),
    readIds: new Set(readIds("read-notices")),
  };

  return cachedState;
}

function addIds(key: NoticeInboxKey, ids: string[]) {
  const stored = readIds(key);
  const merged = [...new Set([...stored, ...ids])];
  if (merged.length === stored.length) return;
  storage.setItem(key, merged);
}

function closeNoticeInbox() {
  isOpen = false;
  publish();
}

function openNoticeInbox(notices: readonly TangleNotice[]) {
  addIds(
    "read-notices",
    notices.map((notice) => notice.id),
  );
  isOpen = true;
  publish();
}

function markHidden(notice: TangleNotice) {
  if (!notice.dismissible) {
    hiddenForThisSession.add(notice.id);
    return;
  }

  addIds("hidden-notices", [notice.id]);
  if (!readIds("hidden-notices").includes(notice.id))
    hiddenForThisSession.add(notice.id);
}

function hideNotice(notice: TangleNotice) {
  markHidden(notice);
  publish();
}

function hideAll(notices: readonly TangleNotice[]) {
  notices.forEach(markHidden);
  publish();
}

function showAll() {
  hiddenForThisSession.clear();
  storage.setItem("hidden-notices", []);
  publish();
}

function dismissNotice(notice: TangleNotice) {
  if (notice.dismissible) {
    addIds("dismissed-notices", [notice.id]);
    if (!readIds("dismissed-notices").includes(notice.id))
      dismissedForThisSession.add(notice.id);
  } else {
    dismissedForThisSession.add(notice.id);
  }

  publish();
}

export function resetNoticeStateForTests(): void {
  resetNoticeCacheForTests();
  resetNoticeRefreshForTests();
  hiddenForThisSession.clear();
  dismissedForThisSession.clear();
  isOpen = false;
  cachedState = null;
  cachedRevision = -1;
}

export interface NoticeInbox {
  notices: readonly TangleNotice[];
  banners: readonly TangleNotice[];
  unreadCount: number;
  hasHiddenNotices: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  hide: (notice: TangleNotice) => void;
  hideBanners: () => void;
  showBanners: () => void;
  dismiss: (notice: TangleNotice) => void;
}

export function useNoticeInbox(): NoticeInbox {
  const notices = useNotices();
  const revision = useSyncExternalStore(subscribe, getRevision);
  const {
    isOpen,
    dismissedIds,
    hiddenIds,
    readIds: readIdSet,
  } = getInboxState(revision);

  const listed = notices
    .filter((notice) => !dismissedIds.has(notice.id))
    .sort((a, b) => PROMOTION_ORDER[a.variant] - PROMOTION_ORDER[b.variant]);

  const banners = listed.filter((notice) => !hiddenIds.has(notice.id));

  return {
    notices: listed,
    banners,
    unreadCount: listed.filter((notice) => !readIdSet.has(notice.id)).length,
    hasHiddenNotices: banners.length < listed.length,
    isOpen,
    setOpen: (open) => (open ? openNoticeInbox(listed) : closeNoticeInbox()),
    hide: hideNotice,
    hideBanners: () => hideAll(listed),
    showBanners: showAll,
    dismiss: dismissNotice,
  };
}
