import { useSyncExternalStore } from "react";

import type { TangleNotice } from "@/config/notices";
import { getStorage } from "@/utils/typedStorage";

const HIDDEN_KEY = "hidden-notices";

const storage = getStorage<
  typeof HIDDEN_KEY,
  Record<typeof HIDDEN_KEY, string[]>
>();

const hiddenForThisSession = new Set<string>();

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
  if (event.key === HIDDEN_KEY) publish();
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

function readHiddenIds(): string[] {
  const stored = storage.getItem(HIDDEN_KEY);
  return Array.isArray(stored) ? stored : [];
}

let cachedHiddenIds: ReadonlySet<string> | null = null;
let cachedRevision = -1;

function getHiddenIds(revision: number): ReadonlySet<string> {
  if (cachedHiddenIds && cachedRevision === revision) return cachedHiddenIds;

  cachedRevision = revision;
  cachedHiddenIds = new Set([...readHiddenIds(), ...hiddenForThisSession]);

  return cachedHiddenIds;
}

function markHidden(notice: TangleNotice) {
  if (notice.dismissible) {
    const stored = readHiddenIds();
    if (!stored.includes(notice.id))
      storage.setItem(HIDDEN_KEY, [...stored, notice.id]);
  }

  if (!readHiddenIds().includes(notice.id)) hiddenForThisSession.add(notice.id);
}

function hideNotice(notice: TangleNotice) {
  markHidden(notice);
  publish();
}

function hideEvery(notices: readonly TangleNotice[]) {
  notices.forEach(markHidden);
  publish();
}

function showEvery() {
  hiddenForThisSession.clear();
  storage.setItem(HIDDEN_KEY, []);
  publish();
}

export function resetHiddenNoticesForTests(): void {
  hiddenForThisSession.clear();
  cachedHiddenIds = null;
  cachedRevision = -1;
}

export interface HiddenNotices {
  hiddenIds: ReadonlySet<string>;
  hide: (notice: TangleNotice) => void;
  hideAll: (notices: readonly TangleNotice[]) => void;
  showAll: () => void;
}

export function useHiddenNotices(): HiddenNotices {
  const revision = useSyncExternalStore(subscribe, getRevision);

  return {
    hiddenIds: getHiddenIds(revision),
    hide: hideNotice,
    hideAll: hideEvery,
    showAll: showEvery,
  };
}
