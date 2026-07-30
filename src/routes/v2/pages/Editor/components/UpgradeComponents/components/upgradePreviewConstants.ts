import type { DiffStatus } from "@/utils/diffStatus";

export const DIFF_STATUS_CLASSES: Record<DiffStatus, string> = {
  unchanged: "bg-gray-200 text-gray-800",
  lost: "bg-red-100 text-red-700 line-through",
  new: "bg-green-100 text-green-700",
  changed: "bg-amber-100 text-amber-700",
};

export const HANDLE_STATUS_CLASSES: Record<DiffStatus, string> = {
  unchanged: "!bg-gray-500",
  lost: "!bg-red-400",
  new: "!bg-green-500",
  changed: "!bg-amber-500",
};
