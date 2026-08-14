import { type ReactNode } from "react";

import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SidebarSection = ({
  title,
  headerAction,
  children,
  className,
}: SidebarSectionProps) => {
  return (
    <BlockStack gap="2" className={cn("p-2", className)}>
      <InlineStack align="space-between" className="w-full">
        <Text
          as="h3"
          size="sm"
          weight="medium"
          className="text-sidebar-foreground/70"
        >
          {title}
        </Text>
        {headerAction}
      </InlineStack>

      {children}
    </BlockStack>
  );
};
