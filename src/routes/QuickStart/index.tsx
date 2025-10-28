import QuickStartCards from "@/components/shared/QuickStart/QuickStartCards";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Heading, Paragraph } from "@/components/ui/typography";

export const QuickStartPage = () => {
  return (
    <div className="container mx-auto p-6">
      <BlockStack className="mb-8">
        <Heading level={1}>
          <InlineStack gap="2">
            <Icon name="Sparkles" size="lg" className="text-purple-600" />
            Quick Start with Sample Pipelines
          </InlineStack>
        </Heading>
        <Paragraph size="md" tone="subdued">
          Get started quickly with our pre-built pipeline templates. Each
          template demonstrates different ML workflow patterns and best
          practices. Simply click on any template to import it and start
          customizing.
        </Paragraph>
        <BlockStack className="pt-8">
          <QuickStartCards />
        </BlockStack>
      </BlockStack>
    </div>
  );
};
