import type { ReactNode } from "react";

import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Breadcrumbs } from "@/components/ui/patterns/breadcrumbs";
import { Heading, Paragraph } from "@/components/ui/typography";

/**
 * PageHeader — Layer 3 semantic primitive.
 *
 * Standard page heading for WorkArea pages: an optional breadcrumb trail above
 * a title and optional description, with an optional right-aligned actions slot.
 */

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Crumb content, wrapped in `Breadcrumbs`. */
  breadcrumb?: ReactNode;
  /** Right-aligned slot opposite the title (space-between). */
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <BlockStack gap="2">
      {breadcrumb ? <Breadcrumbs>{breadcrumb}</Breadcrumbs> : null}
      <InlineStack align="space-between" blockAlign="center" wrap="nowrap">
        <BlockStack gap="1">
          <Heading level={1} size="xl" weight="bold">
            {title}
          </Heading>
          {description ? (
            <Paragraph size="sm" tone="subdued">
              {description}
            </Paragraph>
          ) : null}
        </BlockStack>
        {actions ?? null}
      </InlineStack>
    </BlockStack>
  );
}

PageHeader.displayName = "PageHeader";
