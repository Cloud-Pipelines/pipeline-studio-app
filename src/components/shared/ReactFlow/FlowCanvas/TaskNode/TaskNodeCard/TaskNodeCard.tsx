import { useStore } from "@xyflow/react";
import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PublishedComponentBadge } from "@/components/shared/ManageComponent/PublishedComponentBadge";
import { trimDigest } from "@/components/shared/ManageComponent/utils/digest";
import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { QuickTooltip } from "@/components/ui/tooltip";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { useTaskNode } from "@/providers/TaskNodeProvider";
import { getSubgraphDescription, isSubgraph } from "@/utils/subgraphUtils";

import {
  type NotifyMessage,
  type UpdateOverlayMessage,
  useNodesOverlay,
} from "../../../NodesOverlay/NodesOverlayProvider";
import TaskConfiguration from "../TaskConfiguration";
import { TaskNodeInputs } from "./TaskNodeInputs";
import { TaskNodeOutputs } from "./TaskNodeOutputs";
import { UpgradeNodePopover } from "./UpgradeNodePopover";

const TaskNodeCard = () => {
  const isRemoteComponentLibrarySearchEnabled = useBetaFlagValue(
    "remote-component-library-search",
  );
  const { registerNode } = useNodesOverlay();
  const taskNode = useTaskNode();
  const { setContent, clearContent } = useContextPanel();
  const { navigateToSubgraph } = useComponentSpec();

  const isDragging = useStore((state) => {
    const thisNode = state.nodes.find((node) => node.id === taskNode.nodeId);
    return thisNode?.dragging || false;
  });

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [updateOverlayDialogOpen, setUpdateOverlayDialogOpen] = useState<
    UpdateOverlayMessage["data"] | undefined
  >();
  const [highlightedState, setHighlighted] = useState(false);

  const [scrollHeight, setScrollHeight] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState(false);

  const { name, state, callbacks, nodeId, taskSpec, taskId } = taskNode;
  const { dimensions, selected, highlighted, isCustomComponent, readOnly } =
    state;

  // Subgraph detection
  const isSubgraphNode = useMemo(() => isSubgraph(taskSpec), [taskSpec]);
  const subgraphDescription = useMemo(
    () => (isSubgraphNode ? getSubgraphDescription(taskSpec) : ""),
    [isSubgraphNode, taskSpec],
  );

  const onNotify = useCallback((message: NotifyMessage) => {
    switch (message.type) {
      case "highlight":
        setHighlighted(true);
        break;
      case "clear":
        setHighlighted(false);
        break;
      case "update-overlay":
        setHighlighted(true);
        setUpdateOverlayDialogOpen({
          ...message.data,
        });
        break;
    }
  }, []);

  useEffect(() => {
    return registerNode({
      nodeId,
      taskSpec,
      onNotify,
    });
  }, [registerNode, nodeId, taskSpec, onNotify]);

  const closeOverlayPopover = useCallback((open: boolean) => {
    setHighlighted(open);

    if (!open) {
      setUpdateOverlayDialogOpen(undefined);
    }
  }, []);

  const taskConfigMarkup = useMemo(() => {
    const actions = [];

    // Add editing actions only in non-readOnly mode
    if (!readOnly) {
      actions.push(
        {
          children: (
            <div className="flex items-center gap-2">
              <CopyIcon />
            </div>
          ),
          variant: "secondary" as const,
          tooltip: "Duplicate Task",
          onClick: callbacks.onDuplicate,
        },
        {
          children: (
            <div className="flex items-center gap-2">
              <CircleFadingArrowUp />
            </div>
          ),
          variant: "secondary" as const,
          className: cn(isCustomComponent && "hidden"),
          tooltip: "Update Task from Source URL",
          onClick: callbacks.onUpgrade,
        },
      );
    }

    // Add subgraph navigation action if this is a subgraph node (always show, even in readOnly)
    if (isSubgraphNode && taskId) {
      actions.push({
        children: (
          <div className="flex items-center gap-2">
            <Icon name="Workflow" size="sm" />
          </div>
        ),
        variant: "secondary" as const,
        tooltip: `Enter Subgraph: ${subgraphDescription}`,
        onClick: () => navigateToSubgraph(taskId),
      });
    }

    return (
      <TaskConfiguration taskNode={taskNode} key={nodeId} actions={actions} />
    );
  }, [
    nodeId,
    readOnly,
    callbacks.onDuplicate,
    callbacks.onUpgrade,
    isCustomComponent,
    isSubgraphNode,
    taskId,
    subgraphDescription,
    navigateToSubgraph,
  ]);

  const handleInputSectionClick = useCallback(() => {
    setExpandedInputs((prev) => !prev);
  }, []);

  const handleOutputSectionClick = useCallback(() => {
    setExpandedOutputs((prev) => !prev);
  }, []);

  useEffect(() => {
    if (nodeRef.current) {
      setScrollHeight(nodeRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    if (contentRef.current && scrollHeight > 0 && dimensions.h) {
      setCondensed(scrollHeight > dimensions.h);
    }
  }, [scrollHeight, dimensions.h]);

  useEffect(() => {
    if (selected && !isDragging) {
      setContent(taskConfigMarkup);
    }

    return () => {
      if (selected) {
        clearContent();
      }
    };
  }, [selected, taskConfigMarkup, setContent, clearContent]);

  const digestMarkup = taskSpec.componentRef?.digest && (
    <QuickTooltip content={taskSpec.componentRef.digest}>
      <div className="text-xs font-light font-mono">
        {trimDigest(taskSpec.componentRef.digest)}
      </div>
    </QuickTooltip>
  );

  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 break-words p-0 drop-shadow-none gap-2",
        selected ? "border-gray-500" : "hover:border-slate-200",
        (highlighted || highlightedState) && "border-orange-500!",
      )}
      style={{
        width: dimensions.w + "px",
        height: condensed || !dimensions.h ? "auto" : dimensions.h + "px",
        transition: "height 0.2s",
      }}
      ref={nodeRef}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5 flex flex-row justify-between items-start">
        <BlockStack>
          <div className="flex items-center gap-1.5">
            {isSubgraphNode && (
              <QuickTooltip content={`Subgraph: ${subgraphDescription}`}>
                <Icon
                  name="Workflow"
                  size="sm"
                  className="text-blue-600 flex-shrink-0"
                />
              </QuickTooltip>
            )}
            <CardTitle className="break-words text-left text-xs text-slate-900">
              {name}
            </CardTitle>
          </div>
          {taskId &&
            taskId !== name &&
            !taskId.match(new RegExp(`^${name}\\s*\\d+$`)) && (
              <Text size="xs" tone="subdued" className="font-light">
                {taskId}
              </Text>
            )}
        </BlockStack>

        {isRemoteComponentLibrarySearchEnabled ? (
          <PublishedComponentBadge componentRef={taskSpec.componentRef}>
            {digestMarkup}
          </PublishedComponentBadge>
        ) : (
          digestMarkup
        )}
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        <div
          style={{
            maxHeight:
              dimensions.h && !(expandedInputs || expandedOutputs)
                ? `${dimensions.h}px`
                : "100%",
          }}
          ref={contentRef}
        >
          <TaskNodeInputs
            condensed={condensed}
            expanded={expandedInputs}
            onBackgroundClick={handleInputSectionClick}
          />

          <TaskNodeOutputs
            condensed={condensed}
            expanded={expandedOutputs}
            onBackgroundClick={handleOutputSectionClick}
          />
        </div>
        {isRemoteComponentLibrarySearchEnabled && updateOverlayDialogOpen ? (
          <UpgradeNodePopover
            currentNode={taskNode}
            onOpenChange={closeOverlayPopover}
            {...updateOverlayDialogOpen}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TaskNodeCard;
