import { Button } from "@/components/ui/button";
import { InlineStack } from "@/components/ui/layout";
import { Paragraph } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export const TogglePreview = ({
  showPreview,
  setShowPreview,
}: {
  showPreview: boolean;
  setShowPreview: (showPreview: boolean) => void;
}) => {
  return (
    <InlineStack gap="1" blockAlign="center">
      <Paragraph>Preview:</Paragraph>
      <Button
        variant="link"
        className={cn(
          showPreview
            ? "text-bold"
            : "hover:no-underline text-blue-400 disabled:opacity-100",
        )}
        onClick={() => setShowPreview(true)}
        disabled={showPreview}
      >
        Card
      </Button>
      <Paragraph>|</Paragraph>
      <Button
        variant="link"
        className={cn(
          showPreview
            ? "hover:no-underline text-blue-400 disabled:opacity-100"
            : "text-bold",
        )}
        onClick={() => setShowPreview(false)}
        disabled={!showPreview}
      >
        YAML
      </Button>
    </InlineStack>
  );
};
