import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { AgentApproval } from "@/routes/v2/shared/components/AiChat/agentClient";

interface ToolApprovalProps {
  approval: AgentApproval;
  disabled: boolean;
}

function formatToolName(toolName: string): string {
  return toolName.replaceAll("_", " ");
}

function approvalHeading(approval: AgentApproval): string {
  const toolName = formatToolName(approval.toolName);
  if (approval.decision === "approved") return `Approved ${toolName}`;
  if (approval.decision === "rejected") return `Rejected ${toolName}`;
  return `Approve ${toolName}?`;
}

export function ToolApproval({ approval, disabled }: ToolApprovalProps) {
  const [selectedDecision, setSelectedDecision] = useState(approval.decision);

  function approve() {
    setSelectedDecision("approved");
    approval.approve();
  }

  function reject() {
    setSelectedDecision("rejected");
    approval.reject();
  }

  const displayedApproval = { ...approval, decision: selectedDecision };

  return (
    <div role="alert">
      <BlockStack gap="2" className="rounded-md border bg-muted/40 p-3">
        <Text size="sm" weight="semibold">
          {approvalHeading(displayedApproval)}
        </Text>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-xs">
          {JSON.stringify(approval.input, null, 2)}
        </pre>
        <InlineStack gap="2">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              selectedDecision === "approved" &&
                "border-success bg-success text-white hover:bg-success/90 hover:text-white dark:border-success dark:bg-success dark:text-white dark:hover:bg-success/90",
            )}
            aria-pressed={selectedDecision === "approved"}
            onClick={approve}
            disabled={disabled}
          >
            {selectedDecision === "approved" ? "Approved" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant={
              selectedDecision === "rejected" ? "destructive" : "outline"
            }
            aria-pressed={selectedDecision === "rejected"}
            onClick={reject}
            disabled={disabled}
          >
            {selectedDecision === "rejected" ? "Rejected" : "Reject"}
          </Button>
        </InlineStack>
      </BlockStack>
    </div>
  );
}
