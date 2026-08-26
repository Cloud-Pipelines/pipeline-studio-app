import { useSyncExternalStore } from "react";

import { resetBannerCacheForTests, type TangleBanner } from "@/config/banners";
import { resetBannerRefreshForTests, useBanners } from "@/hooks/useBanners";
import { getStorage } from "@/utils/typedStorage";

const STORAGE_KEYS = [
  "dismissed-banners",
  "hidden-banners",
  "read-banners",
] as const;

type BannerInboxKey = (typeof STORAGE_KEYS)[number];

const storage = getStorage<BannerInboxKey, Record<BannerInboxKey, string[]>>();

const PROMOTION_ORDER: Record<TangleBanner["variant"], number> = {
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

function readIds(key: BannerInboxKey): string[] {
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
      ...readIds("dismissed-banners"),
      ...dismissedForThisSession,
    ]),
    hiddenIds: new Set([...readIds("hidden-banners"), ...hiddenForThisSession]),
    readIds: new Set(readIds("read-banners")),
  };

  return cachedState;
}

function addIds(key: BannerInboxKey, ids: string[]) {
  const stored = readIds(key);
  const merged = [...new Set([...stored, ...ids])];
  if (merged.length === stored.length) return;
  storage.setItem(key, merged);
}

function closeBannerInbox() {
  isOpen = false;
  publish();
}

function openBannerInbox(banners: readonly TangleBanner[]) {
  addIds(
    "read-banners",
    banners.map((banner) => banner.id),
  );
  isOpen = true;
  publish();
}

function markHidden(banner: TangleBanner) {
  if (!banner.dismissible) {
    hiddenForThisSession.add(banner.id);
    return;
  }

  addIds("hidden-banners", [banner.id]);
  if (!readIds("hidden-banners").includes(banner.id))
    hiddenForThisSession.add(banner.id);
}

function hideBanner(banner: TangleBanner) {
  markHidden(banner);
  publish();
}

function hideStrip(banners: readonly TangleBanner[]) {
  banners.forEach(markHidden);
  publish();
}

function showStrip() {
  hiddenForThisSession.clear();
  storage.setItem("hidden-banners", []);
  publish();
}

function dismissBanner(banner: TangleBanner) {
  if (banner.dismissible) {
    addIds("dismissed-banners", [banner.id]);
    if (!readIds("dismissed-banners").includes(banner.id))
      dismissedForThisSession.add(banner.id);
  } else {
    dismissedForThisSession.add(banner.id);
  }

  publish();
}

export function resetBannerStateForTests(): void {
  resetBannerCacheForTests();
  resetBannerRefreshForTests();
  hiddenForThisSession.clear();
  dismissedForThisSession.clear();
  isOpen = false;
  cachedState = null;
  cachedRevision = -1;
}

export interface BannerInbox {
  banners: readonly TangleBanner[];
  showing: readonly TangleBanner[];
  unreadCount: number;
  hasHiddenBanners: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  hide: (banner: TangleBanner) => void;
  hideStrip: () => void;
  showStrip: () => void;
  dismiss: (banner: TangleBanner) => void;
}

export function useBannerInbox(): BannerInbox {
  const banners = useBanners();
  const revision = useSyncExternalStore(subscribe, getRevision);
  const {
    isOpen,
    dismissedIds,
    hiddenIds,
    readIds: readIdSet,
  } = getInboxState(revision);

  const listed = banners
    .filter((banner) => !dismissedIds.has(banner.id))
    .sort((a, b) => PROMOTION_ORDER[a.variant] - PROMOTION_ORDER[b.variant]);

  const showing = listed.filter((banner) => !hiddenIds.has(banner.id));

  return {
    banners: listed,
    showing,
    unreadCount: listed.filter((banner) => !readIdSet.has(banner.id)).length,
    hasHiddenBanners: showing.length < listed.length,
    isOpen,
    setOpen: (open) => (open ? openBannerInbox(listed) : closeBannerInbox()),
    hide: hideBanner,
    hideStrip: () => hideStrip(listed),
    showStrip,
    dismiss: dismissBanner,
  };
}
