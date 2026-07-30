import type { DiffStatus } from "@/utils/diffStatus";

export const MEMBERSHIP_BORDER: Record<DiffStatus, string> = {
  unchanged: "border-diff-unchanged",
  lost: "border-diff-lost",
  new: "border-diff-new",
  changed: "border-diff-changed",
};
