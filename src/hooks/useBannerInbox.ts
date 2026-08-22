import { useSyncExternalStore } from "react";

import type { TangleBanner } from "@/config/banners";
import { useBanners } from "@/hooks/useBanners";
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

export function closeBannerInbox() {
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

function hideStrip(banners: readonly TangleBanner[]) {
  banners
    .filter((banner) => !banner.dismissible)
    .forEach((banner) => hiddenForThisSession.add(banner.id));

  addIds(
    "hidden-banners",
    banners.filter((banner) => banner.dismissible).map((banner) => banner.id),
  );
  publish();
}

function showStrip() {
  hiddenForThisSession.clear();
  storage.setItem("hidden-banners", []);
  publish();
}

function dismissBanner(banner: TangleBanner) {
  addIds("dismissed-banners", [banner.id]);
  if (!readIds("dismissed-banners").includes(banner.id))
    dismissedForThisSession.add(banner.id);
  publish();
}

export interface BannerInbox {
  banners: readonly TangleBanner[];
  showing: readonly TangleBanner[];
  unreadCount: number;
  isStripHidden: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  hideStrip: () => void;
  showStrip: () => void;
  dismiss: (banner: TangleBanner) => void;
}

export function useBannerInbox(): BannerInbox {
  const banners = useBanners();
  const revision = useSyncExternalStore(subscribe, getRevision);
  const {
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
    isStripHidden: showing.length === 0 && listed.length > 0,
    isOpen,
    setOpen: (open) => (open ? openBannerInbox(listed) : closeBannerInbox()),
    hideStrip: () => hideStrip(listed),
    showStrip,
    dismiss: dismissBanner,
  };
}
