import { useCallback, useMemo } from "react";

import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { InlineStack } from "@/components/ui/layout";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/typography";

interface BooleanToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

export const BooleanToggle = ({
  value,
  onValueChange,
  disabled = false,
  className,
  showLabel = true,
  labelClassName,
}: BooleanToggleProps) => {
  const useToggleForBooleanFields = useBetaFlagValue(
    "use-toggle-for-boolean-fields",
  );

  // Convert string value to boolean for switch
  const booleanValue = useMemo(() => {
    const val = value.toLowerCase();
    return val === "true";
  }, [value]);

  const handleSwitchChange = useCallback(
    (checked: boolean) => {
      const newValue = checked ? "True" : "False";
      onValueChange(newValue);
    },
    [onValueChange],
  );

  // Don't render if beta flag is disabled
  if (!useToggleForBooleanFields) {
    return null;
  }

  return (
    <InlineStack gap="2" blockAlign="center" className={className}>
      <Switch
        checked={booleanValue}
        onCheckedChange={handleSwitchChange}
        disabled={disabled}
      />
      {showLabel && (
        <Text size="sm" tone="subdued" className={labelClassName}>
          {booleanValue ? "True" : "False"}
        </Text>
      )}
    </InlineStack>
  );
};
