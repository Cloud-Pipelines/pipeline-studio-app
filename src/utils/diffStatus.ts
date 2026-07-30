import type { IconName } from "@/components/ui/icon";

/**
 * Membership of an entity in a before/after pair, shared by the editor's
 * component upgrade preview and the run comparison view.
 */
export type DiffStatus = "unchanged" | "lost" | "new" | "changed";

export const DIFF_STATUS_ICON: Partial<
  Record<DiffStatus, { name: IconName; className: string }>
> = {
  lost: { name: "Minus", className: "text-diff-lost" },
  new: { name: "Plus", className: "text-diff-new" },
  changed: { name: "RefreshCw", className: "text-diff-changed" },
};
