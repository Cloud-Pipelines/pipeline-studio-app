import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  EXECUTION_STATUS_BG_COLORS,
  getExecutionStatusLabel,
} from "@/utils/executionStatus";

interface ExecutionStatusPillProps {
  label?: string;
  status: string | undefined;
}

export function ExecutionStatusPill({
  label,
  status,
}: ExecutionStatusPillProps) {
  if (!status) return null;

  return (
    <InlineStack gap="1" blockAlign="center" wrap="nowrap">
      {label && (
        <Text as="span" size="xs" tone="subdued">
          {label}
        </Text>
      )}
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          EXECUTION_STATUS_BG_COLORS[status] ?? "bg-muted",
        )}
      />
      <Text as="span" size="xs">
        {getExecutionStatusLabel(status)}
      </Text>
    </InlineStack>
  );
}
