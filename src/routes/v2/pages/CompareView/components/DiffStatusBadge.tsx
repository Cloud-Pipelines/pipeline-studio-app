import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { DIFF_STATUS_ICON, type DiffStatus } from "@/utils/diffStatus";

export const DIFF_STATUS_LABELS: Record<DiffStatus, string> = {
  unchanged: "Unchanged",
  lost: "Removed",
  new: "Added",
  changed: "Changed",
};

const DIFF_STATUS_TONE: Record<DiffStatus, string> = {
  unchanged: "bg-diff-unchanged text-diff-unchanged-foreground",
  lost: "bg-diff-lost text-diff-lost-foreground line-through",
  new: "bg-diff-new text-diff-new-foreground",
  changed: "bg-diff-changed text-diff-changed-foreground",
};

interface DiffStatusBadgeProps {
  status: DiffStatus;
  className?: string;
}

export function DiffStatusBadge({ status, className }: DiffStatusBadgeProps) {
  const icon = DIFF_STATUS_ICON[status];

  return (
    <InlineStack
      as="span"
      gap="1"
      blockAlign="center"
      wrap="nowrap"
      className={cn(
        "rounded px-1.5 py-0.5",
        DIFF_STATUS_TONE[status],
        className,
      )}
    >
      {icon && <Icon name={icon.name} size="xs" />}
      <Text as="span" size="xs" weight="semibold" className="text-inherit">
        {DIFF_STATUS_LABELS[status]}
      </Text>
    </InlineStack>
  );
}
