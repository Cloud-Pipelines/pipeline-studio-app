import { useSyncExternalStore } from "react";

import type { TangleNotice } from "@/config/notices";
import { useNotices } from "@/hooks/useNotices";
import { getStorage } from "@/utils/typedStorage";

const READ_KEY = "read-notices";

const storage = getStorage<
  typeof READ_KEY,
  Record<typeof READ_KEY, string[]>
>();

const readForThisSession = new Set<string>();

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
  if (event.key === READ_KEY) publish();
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

function readIds(): string[] {
  const stored = storage.getItem(READ_KEY);
  return Array.isArray(stored) ? stored : [];
}

let cachedReadIds: Set<string> | null = null;
let cachedRevision = -1;

function getReadIds(revision: number): Set<string> {
  if (cachedReadIds && cachedRevision === revision) return cachedReadIds;

  cachedRevision = revision;
  cachedReadIds = new Set([...readIds(), ...readForThisSession]);

  return cachedReadIds;
}

export function closeNoticeInbox() {
  isOpen = false;
  publish();
}

function openNoticeInbox(notices: readonly TangleNotice[]) {
  const stored = readIds();
  const merged = [...new Set([...stored, ...notices.map(({ id }) => id)])];
  if (merged.length !== stored.length) storage.setItem(READ_KEY, merged);

  const persisted = new Set(readIds());
  notices.forEach(({ id }) => {
    if (!persisted.has(id)) readForThisSession.add(id);
  });

  isOpen = true;
  publish();
}

export function resetNoticeInboxForTests(): void {
  isOpen = false;
  readForThisSession.clear();
  cachedReadIds = null;
  cachedRevision = -1;
}

export interface NoticeInbox {
  notices: readonly TangleNotice[];
  unreadCount: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  dismiss: (notice: TangleNotice) => void;
}

export function useNoticeInbox(): NoticeInbox {
  const { notices, dismiss } = useNotices();
  const revision = useSyncExternalStore(subscribe, getRevision);
  const readIdSet = getReadIds(revision);

  return {
    notices,
    unreadCount: notices.filter((notice) => !readIdSet.has(notice.id)).length,
    isOpen,
    setOpen: (open) => (open ? openNoticeInbox(notices) : closeNoticeInbox()),
    dismiss,
  };
}
