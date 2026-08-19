import type { ReactNode } from "react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";

interface IOCollapsibleSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

const IOCollapsibleSection = ({
  title,
  count,
  children,
}: IOCollapsibleSectionProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1 rounded-sm py-0.5 hover:bg-muted/50">
        <Icon
          name={open ? "ChevronDown" : "ChevronRight"}
          size="xs"
          className="text-muted-foreground"
        />
        <Text size="md" weight="semibold">
          {title}
        </Text>
        {count > 0 && (
          <Text size="xs" tone="subdued">
            {count}
          </Text>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <BlockStack gap="1" className="w-full pt-1">
          {children}
        </BlockStack>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default IOCollapsibleSection;
