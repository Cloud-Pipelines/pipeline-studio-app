import { icons } from "lucide-react";

import type { IconName } from "@/components/ui/icon";
import { isRecord } from "@/utils/typeGuards";

export interface ExtraNavItem {
  label: string;
  href: string;
  icon?: IconName;
  requiresPermission?: string;
  external?: boolean;
}

declare global {
  interface Window {
    __TANGLE_EXTRA_NAV_ITEMS__?: ExtraNavItem[];
  }
}

function readIconName(value: unknown): IconName | undefined {
  if (typeof value !== "string" || !(value in icons)) return undefined;
  return value as IconName;
}

/**
 * Only same-origin paths and http(s) URLs are accepted, so a host page that
 * assembles this config from somewhere less trusted than its own markup cannot
 * turn a nav item into a `javascript:` sink.
 */
function readHref(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const href = value.trim();
  if (href.startsWith("/")) return href;

  return /^https?:\/\//i.test(href) ? href : null;
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}

function readNavItem(value: unknown): ExtraNavItem | null {
  if (!isRecord(value)) return null;

  const href = readHref(value.href);
  const label = readTrimmedString(value.label);
  if (!href || !label) return null;

  const icon = readIconName(value.icon);
  const requiresPermission = readTrimmedString(value.requiresPermission);

  return {
    label,
    href,
    ...(icon ? { icon } : {}),
    ...(requiresPermission ? { requiresPermission } : {}),
    ...(value.external === true ? { external: true } : {}),
  };
}

export function getExtraNavItems(permissions: string[]): ExtraNavItem[] {
  if (typeof window === "undefined") return [];

  const injected = window.__TANGLE_EXTRA_NAV_ITEMS__;
  if (!Array.isArray(injected)) return [];

  return injected
    .map(readNavItem)
    .filter((item) => item !== null)
    .filter(
      (item) =>
        !item.requiresPermission ||
        permissions.includes(item.requiresPermission),
    );
}
