import { type ComponentProps, useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Heading } from "@/components/ui/typography";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { TaskNodeContextType } from "@/providers/TaskNodeProvider";

import {
  type UpdateOverlayMessage,
  useNodesOverlay,
} from "../../../NodesOverlay/NodesOverlayProvider";
import { getUpgradeConfirmationDetails } from "../../ConfirmationDialogs/UpgradeComponent";
import { replaceTaskNode } from "../../utils/replaceTaskNode";

/**
 * Popover that appears when a task is upgraded.
 *
 * @param currentNode - The current task node
 * @param ids - The ids of the nodes to upgrade
 * @param replaceWith - The component reference to replace the task with
 * @param onOpenChange - The function to call when the popover is opened or closed
 * @param props - The props for the popover
 *
 * @returns The UpgradeNodePopover component
 */
export const UpgradeNodePopover = ({
  currentNode,
  ids,
  replaceWith,
  onOpenChange,
  ...props
}: ComponentProps<typeof Popover> &
  UpdateOverlayMessage["data"] & {
    currentNode: TaskNodeContextType;
  }) => {
  const [open, setOpen] = useState(true);
  const { taskId, taskSpec } = currentNode;
  const { graphSpec, updateGraphSpec } = useComponentSpec();
  const { notifyNode, fitNodeIntoView } = useNodesOverlay();

  const updatePreview = useMemo(() => {
    return replaceTaskNode(taskId, replaceWith, graphSpec);
  }, [taskId, replaceWith, graphSpec]);

  const markup = useMemo(() => {
    const { content } = getUpgradeConfirmationDetails(
      taskId,
      taskSpec,
      replaceWith.digest,
      updatePreview.lostInputs,
    );

    return content;
  }, [taskId, taskSpec, replaceWith, updatePreview.lostInputs]);

  const handleOpenChange = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleNext = useCallback(async () => {
    handleOpenChange();

    if (ids.length === 0) {
      return;
    }

    const nodeId = ids.pop();

    if (!nodeId) {
      return;
    }

    await fitNodeIntoView(nodeId);

    notifyNode(nodeId, {
      type: "update-overlay",
      data: {
        replaceWith,
        ids,
      },
    });
  }, [fitNodeIntoView, ids, replaceWith, notifyNode, handleOpenChange]);

  const handleApplyAndNext = useCallback(async () => {
    updateGraphSpec(updatePreview.updatedGraphSpec);

    void handleNext();
  }, [handleNext, updatePreview.updatedGraphSpec, updateGraphSpec]);

  return (
    <Popover {...props} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger />
      <PopoverContent>
        <BlockStack gap="2">
          <Heading level={2}>Upgrade task</Heading>
          {markup}
          <InlineStack align="space-between" className="w-full">
            <Button onClick={handleNext} variant="secondary" size="xs">
              Skip
            </Button>
            <Button onClick={handleApplyAndNext} variant="default" size="xs">
              {ids.length > 0 ? "Accept and move to next task" : "Accept"}
            </Button>
          </InlineStack>
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
};
