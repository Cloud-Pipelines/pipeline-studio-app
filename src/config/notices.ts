import { isRecord } from "@/utils/typeGuards";
import { toAbsoluteHttpUrl } from "@/utils/URL";

interface TangleNoticeAction {
  url: string;
  text: string;
}

export interface TangleNotice {
  id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "success" | "error";
  dismissible?: boolean;
  action?: TangleNoticeAction;
}

interface TangleNoticeSource {
  version: 1;
  getSnapshot: () => TangleNotice[];
  subscribe: (listener: () => void) => () => void;
  refresh?: () => void;
}

declare global {
  interface Window {
    __TANGLE_NOTICE_SOURCE__?: unknown;
  }
}

export const NOTICE_SOURCE_EVENT = "tangle:notice-source";

const SUPPORTED_SOURCE_VERSION = 1;
const VARIANTS: TangleNotice["variant"][] = [
  "info",
  "warning",
  "success",
  "error",
];
const DEFAULT_ACTION_TEXT = "Learn more";
const MAX_NOTICES = 20;

const EMPTY_NOTICES: readonly TangleNotice[] = Object.freeze([]);

let lastSnapshotSignature: string | null = null;
let lastValidatedSnapshot: readonly TangleNotice[] = EMPTY_NOTICES;

function isNoticeSource(value: unknown): value is TangleNoticeSource {
  return (
    isRecord(value) &&
    value.version === SUPPORTED_SOURCE_VERSION &&
    typeof value.getSnapshot === "function" &&
    typeof value.subscribe === "function"
  );
}

function getNoticeSource(): TangleNoticeSource | null {
  if (typeof window === "undefined") return null;
  const source = window.__TANGLE_NOTICE_SOURCE__;
  return isNoticeSource(source) ? source : null;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readTrimmedString(value);
}

function readVariant(value: unknown): TangleNotice["variant"] {
  return VARIANTS.find((variant) => variant === value) ?? "info";
}

function readAction(value: unknown): TangleNoticeAction | null {
  if (!isRecord(value)) return null;

  const url = toAbsoluteHttpUrl(value.url);
  if (!url) return null;

  return { url, text: readTrimmedString(value.text) || DEFAULT_ACTION_TEXT };
}

function readNotice(value: unknown): TangleNotice | null {
  if (!isRecord(value)) return null;

  const id = readId(value.id);
  if (!id) return null;

  const title = readTrimmedString(value.title);
  if (!title) return null;

  const action = readAction(value.action);

  return Object.freeze({
    id,
    title,
    body: typeof value.body === "string" ? value.body : "",
    variant: readVariant(value.variant),
    ...(value.dismissible === true ? { dismissible: true } : {}),
    ...(action ? { action } : {}),
  });
}

function readRawSnapshot(): unknown {
  const source = getNoticeSource();
  if (!source) return null;
  try {
    return source.getSnapshot();
  } catch {
    return null;
  }
}

export function getNoticesSnapshot(): readonly TangleNotice[] {
  const raw = readRawSnapshot();
  if (!Array.isArray(raw)) return EMPTY_NOTICES;

  const byId = new Map<string, TangleNotice>();
  for (const notice of raw.slice(0, MAX_NOTICES).map(readNotice)) {
    if (notice && !byId.has(notice.id)) byId.set(notice.id, notice);
  }
  const validated = [...byId.values()];

  const signature = JSON.stringify(validated);
  if (signature === lastSnapshotSignature) return lastValidatedSnapshot;

  lastSnapshotSignature = signature;
  lastValidatedSnapshot =
    validated.length === 0 ? EMPTY_NOTICES : Object.freeze(validated);

  return lastValidatedSnapshot;
}

function subscribeToSource(listener: () => void): (() => void) | null {
  const source = getNoticeSource();
  if (!source) return null;
  try {
    const unsubscribe = source.subscribe(listener);
    return typeof unsubscribe === "function" ? unsubscribe : null;
  } catch {
    return null;
  }
}

function unsubscribeFromSource(unsubscribe: (() => void) | null): void {
  try {
    unsubscribe?.();
  } catch {
    // A host cleanup that throws must not stop us rebinding or detaching.
  }
}

export function subscribeToNotices(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let unsubscribe = subscribeToSource(listener);

  const rebindToSource = () => {
    unsubscribeFromSource(unsubscribe);
    unsubscribe = subscribeToSource(listener);
    listener();
  };

  window.addEventListener(NOTICE_SOURCE_EVENT, rebindToSource);

  return () => {
    unsubscribeFromSource(unsubscribe);
    window.removeEventListener(NOTICE_SOURCE_EVENT, rebindToSource);
  };
}

export function refreshNotices(): void {
  const source = getNoticeSource();
  if (typeof source?.refresh !== "function") return;
  try {
    source.refresh();
  } catch {
    // A host that fails to re-fetch must not surface an error in the app.
  }
}

export function resetNoticeCacheForTests(): void {
  lastSnapshotSignature = null;
  lastValidatedSnapshot = EMPTY_NOTICES;
}
