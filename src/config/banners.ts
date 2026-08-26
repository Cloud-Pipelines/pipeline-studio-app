import { isRecord } from "@/utils/typeGuards";
import { toAbsoluteHttpUrl } from "@/utils/URL";

export interface TangleBannerAction {
  url: string;
  text: string;
}

export interface TangleBanner {
  id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "success" | "error";
  dismissible?: boolean;
  action?: TangleBannerAction;
}

export interface TangleBannerSource {
  version: 1;
  getSnapshot: () => TangleBanner[];
  subscribe: (listener: () => void) => () => void;
  refresh?: () => void;
}

declare global {
  interface Window {
    __TANGLE_BANNER_SOURCE__?: unknown;
  }
}

export const BANNER_SOURCE_EVENT = "tangle:banner-source";

const SUPPORTED_SOURCE_VERSION = 1;
const VARIANTS: TangleBanner["variant"][] = [
  "info",
  "warning",
  "success",
  "error",
];
const DEFAULT_ACTION_TEXT = "Learn more";
const MAX_BANNERS = 20;

const EMPTY_BANNERS: readonly TangleBanner[] = Object.freeze([]);

let lastSnapshotSignature: string | null = null;
let lastValidatedSnapshot: readonly TangleBanner[] = EMPTY_BANNERS;

function isBannerSource(value: unknown): value is TangleBannerSource {
  return (
    isRecord(value) &&
    value.version === SUPPORTED_SOURCE_VERSION &&
    typeof value.getSnapshot === "function" &&
    typeof value.subscribe === "function"
  );
}

function getBannerSource(): TangleBannerSource | null {
  if (typeof window === "undefined") return null;
  const source = window.__TANGLE_BANNER_SOURCE__;
  return isBannerSource(source) ? source : null;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readTrimmedString(value);
}

function readVariant(value: unknown): TangleBanner["variant"] {
  return VARIANTS.find((variant) => variant === value) ?? "info";
}

function readAction(value: unknown): TangleBannerAction | null {
  if (!isRecord(value)) return null;

  const url = toAbsoluteHttpUrl(value.url);
  if (!url) return null;

  return { url, text: readTrimmedString(value.text) || DEFAULT_ACTION_TEXT };
}

function readBanner(value: unknown): TangleBanner | null {
  if (!isRecord(value)) return null;

  const id = readId(value.id);
  if (!id) return null;

  const title = readTrimmedString(value.title);
  const body = typeof value.body === "string" ? value.body : "";
  if (!title && !body.trim()) return null;

  const action = readAction(value.action);

  return Object.freeze({
    id,
    title,
    body,
    variant: readVariant(value.variant),
    ...(value.dismissible === true ? { dismissible: true } : {}),
    ...(action ? { action } : {}),
  });
}

function readRawSnapshot(): unknown {
  const source = getBannerSource();
  if (!source) return null;
  try {
    return source.getSnapshot();
  } catch {
    return null;
  }
}

export function getBannersSnapshot(): readonly TangleBanner[] {
  const raw = readRawSnapshot();
  if (!Array.isArray(raw)) return EMPTY_BANNERS;

  const byId = new Map<string, TangleBanner>();
  for (const banner of raw.slice(0, MAX_BANNERS).map(readBanner)) {
    if (banner && !byId.has(banner.id)) byId.set(banner.id, banner);
  }
  const validated = [...byId.values()];

  const signature = JSON.stringify(validated);
  if (signature === lastSnapshotSignature) return lastValidatedSnapshot;

  lastSnapshotSignature = signature;
  lastValidatedSnapshot =
    validated.length === 0 ? EMPTY_BANNERS : Object.freeze(validated);

  return lastValidatedSnapshot;
}

function subscribeToSource(listener: () => void): (() => void) | null {
  const source = getBannerSource();
  if (!source) return null;
  try {
    const unsubscribe = source.subscribe(listener);
    return typeof unsubscribe === "function" ? unsubscribe : null;
  } catch {
    return null;
  }
}

export function subscribeToBanners(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let unsubscribe = subscribeToSource(listener);

  const rebindToSource = () => {
    unsubscribe?.();
    unsubscribe = subscribeToSource(listener);
    listener();
  };

  window.addEventListener(BANNER_SOURCE_EVENT, rebindToSource);

  return () => {
    unsubscribe?.();
    window.removeEventListener(BANNER_SOURCE_EVENT, rebindToSource);
  };
}

export function refreshBanners(): void {
  const source = getBannerSource();
  if (typeof source?.refresh !== "function") return;
  try {
    source.refresh();
  } catch {
    // A host that fails to re-fetch must not surface an error in the app.
  }
}

export function resetBannerCacheForTests(): void {
  lastSnapshotSignature = null;
  lastValidatedSnapshot = EMPTY_BANNERS;
}
