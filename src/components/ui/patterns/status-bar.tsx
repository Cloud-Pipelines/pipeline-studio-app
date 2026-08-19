// local primitive

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shell/lib/utils";

/**
 * StatusBar — Layer 3 semantic primitive.
 *
 * A segmented progress bar: one proportional, color-coded segment per execution
 * status. Ported from the sister project's `TaskStatusBar` so the bundle-ui
 * `tangent-status-bar` element resolves to a real, themed primitive. Marked a
 * local primitive because the per-status palette needs raw Tailwind color
 * utilities that the semantic tone tokens do not cover.
 */

export type StatusStats = Record<string, number>;

const STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelled",
  CANCELLING: "Cancelling",
  FAILED: "Failed",
  INVALID: "Invalid",
  PENDING: "Pending",
  QUEUED: "Queued",
  RUNNING: "Running",
  SKIPPED: "Skipped",
  SUCCEEDED: "Succeeded",
  SYSTEM_ERROR: "System error",
  UNINITIALIZED: "Uninitialized",
  WAITING_FOR_UPSTREAM: "Waiting for upstream",
};

const STATUS_BG_COLORS: Record<string, string> = {
  SUCCEEDED: "bg-green-500",
  FAILED: "bg-red-500",
  SYSTEM_ERROR: "bg-red-700",
  INVALID: "bg-red-600",
  RUNNING: "bg-blue-500",
  PENDING: "bg-yellow-500",
  QUEUED: "bg-amber-500",
  WAITING_FOR_UPSTREAM: "bg-slate-500",
  SKIPPED: "bg-slate-400",
  CANCELLED: "bg-gray-700",
  CANCELLING: "bg-gray-500",
  UNINITIALIZED: "bg-yellow-400",
};

/** Display order: success → in-progress → waiting → errors. */
const STATUS_DISPLAY_ORDER = [
  "SUCCEEDED",
  "RUNNING",
  "PENDING",
  "UNINITIALIZED",
  "QUEUED",
  "WAITING_FOR_UPSTREAM",
  "CANCELLING",
  "CANCELLED",
  "FAILED",
  "INVALID",
  "SYSTEM_ERROR",
  "SKIPPED",
] as const;

const HATCHED_SEGMENT_CLASS =
  "bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(0,0,0,0.5)_6px,rgba(0,0,0,0.5)_12px)] bg-blend-multiply bg-repeat bg-[length:512px_24px] bg-[position:left_top]";

const BAR_CLASS =
  "h-2 w-full rounded overflow-hidden bg-muted flex flex-nowrap";

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function StatusSegment({
  status,
  count,
  total,
}: {
  status: string;
  count: number;
  total: number;
}) {
  const label = getStatusLabel(status);
  const colorClass = STATUS_BG_COLORS[status] ?? "bg-slate-300";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(colorClass, "h-full")}
          style={{ width: `${(count / total) * 100}%` }}
          aria-label={`${count} ${label}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        <span>
          {count} {label}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

interface StatusBarProps {
  stats?: StatusStats | null;
}

export function StatusBar({ stats }: StatusBarProps) {
  const entries = stats
    ? Object.entries(stats).filter(([, count]) => (count ?? 0) > 0)
    : [];

  if (entries.length === 0) {
    return <div className={BAR_CLASS} />;
  }

  const total = entries.reduce((sum, [, count]) => sum + (count ?? 0), 0);

  const hasCancelled =
    (stats?.CANCELLED ?? 0) > 0 || (stats?.CANCELLING ?? 0) > 0;

  const orderMap = new Map<string, number>(
    STATUS_DISPLAY_ORDER.map((status, index) => [status, index]),
  );
  const sortedEntries = [...entries].sort(([a], [b]) => {
    const aOrder = orderMap.get(a) ?? STATUS_DISPLAY_ORDER.length;
    const bOrder = orderMap.get(b) ?? STATUS_DISPLAY_ORDER.length;
    return aOrder - bOrder;
  });

  return (
    <div className="relative w-full">
      <div className={BAR_CLASS}>
        {sortedEntries.map(([status, count]) => (
          <StatusSegment
            key={status}
            status={status}
            count={count ?? 0}
            total={total}
          />
        ))}
      </div>
      {hasCancelled && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded",
            HATCHED_SEGMENT_CLASS,
          )}
        />
      )}
    </div>
  );
}

StatusBar.displayName = "StatusBar";
