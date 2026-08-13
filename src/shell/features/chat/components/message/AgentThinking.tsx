import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { useThinkingCollapse } from "@/shell/features/chat/hooks/useThinkingCollapse";
import { Markdown } from "@/shell/lib/markdown/Markdown";

interface ThinkingDisclosureProps {
  thinking: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shared trigger + bordered thinking body for inline and full-bubble disclosures. */
function ThinkingDisclosure({
  thinking,
  open,
  onOpenChange,
}: ThinkingDisclosureProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <BlockStack gap="1">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="xs">
            <Icon name={open ? "ChevronDown" : "ChevronRight"} size="xs" />
            Thinking
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Box padding="base" borderInlineStart="md" paddingInlineStart="sm">
            <Markdown size="xs" tone="subdued">
              {thinking}
            </Markdown>
          </Box>
        </CollapsibleContent>
      </BlockStack>
    </Collapsible>
  );
}

interface AgentThinkingProps {
  thinking: string;
  /**
   * Whether the agent has moved on from reasoning (the answer has started or
   * the message is finalized). Drives auto-collapse: the disclosure stays open
   * while reasoning is live and collapses once `done` flips true.
   */
  done: boolean;
}

export function AgentThinking({ thinking, done }: AgentThinkingProps) {
  const { open, onOpenChange } = useThinkingCollapse(done);

  return (
    <ThinkingDisclosure
      thinking={thinking}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
