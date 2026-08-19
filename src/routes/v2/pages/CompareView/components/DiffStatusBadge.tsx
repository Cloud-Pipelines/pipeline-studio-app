import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { SpotlightMode } from "@/routes/v2/pages/CompareView/utils/buildMergedGraph";
import { DIFF_STATUS_ICON, type DiffStatus } from "@/utils/diffStatus";

const DIFF_STATUS_LABELS: Record<DiffStatus, string> = {
  unchanged: "Unchanged",
  lost: "Removed",
  new: "Added",
  changed: "Changed",
};

const SPOTLIGHT_STATUS_LABELS: Partial<Record<DiffStatus, string>> = {
  lost: "Only in A",
  new: "Only in B",
};

/**
 * "Added" and "Removed" describe a move from A to B, which only makes sense
 * while both runs are on screen. With one run spotlighted the reader is standing
 * inside it, so a task being highlighted *and* called removed contradicts
 * itself — name the run it belongs to instead.
 */
export function diffStatusLabel(
  status: DiffStatus,
  spotlight: SpotlightMode = "both",
): string {
  const sideLabel =
    spotlight === "both" ? undefined : SPOTLIGHT_STATUS_LABELS[status];
  return sideLabel ?? DIFF_STATUS_LABELS[status];
}

const DIFF_STATUS_TONE: Record<DiffStatus, string> = {
  unchanged: "bg-diff-unchanged text-diff-unchanged-foreground",
  lost: "bg-diff-lost text-diff-lost-foreground",
  new: "bg-diff-new text-diff-new-foreground",
  changed: "bg-diff-changed text-diff-changed-foreground",
};

interface DiffStatusBadgeProps {
  status: DiffStatus;
  spotlight?: SpotlightMode;
  className?: string;
}

export function DiffStatusBadge({
  status,
  spotlight = "both",
  className,
}: DiffStatusBadgeProps) {
  const icon = DIFF_STATUS_ICON[status];
  const label = diffStatusLabel(status, spotlight);

  return (
    <InlineStack
      as="span"
      gap="1"
      blockAlign="center"
      wrap="nowrap"
      className={cn(
        "rounded px-1.5 py-0.5",
        DIFF_STATUS_TONE[status],
        status === "lost" && spotlight === "both" && "line-through",
        className,
      )}
    >
      {icon && <Icon name={icon.name} size="xs" />}
      <Text as="span" size="xs" weight="semibold" className="text-inherit">
        {label}
      </Text>
    </InlineStack>
  );
}
