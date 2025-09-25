import { InlineStack } from "@/components/ui/layout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Text } from "@/components/ui/typography";

export const ComponentSpecProperty = ({
  label,
  value,
  tooltip,
}: {
  label: string;
  value?: string;
  tooltip?: string;
}) => {
  if (!value) {
    return null;
  }

  return (
    <InlineStack gap="1">
      <Text as="span" size="xs" weight="semibold">
        {`${label}:`}
      </Text>
      <Text as="span" size="xs">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Text tone="info">{value}</Text>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          value
        )}
      </Text>
    </InlineStack>
  );
};
