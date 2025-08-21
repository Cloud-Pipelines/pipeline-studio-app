import { useStore } from "@xyflow/react";
import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { useTaskNode } from "@/providers/TaskNodeProvider";

import {
  type NotifyMessage,
  useNodesOverlay,
} from "../../../NodesOverlay/NodesOverlayProvider";
import TaskConfiguration from "../TaskConfiguration";
import { TaskNodeInputs } from "./TaskNodeInputs";
import { TaskNodeOutputs } from "./TaskNodeOutputs";

const TaskNodeCard = () => {
  const { registerNode } = useNodesOverlay();
  const taskNode = useTaskNode();
  const { setContent, clearContent } = useContextPanel();

  const [highlightedState, setHighlighted] = useState(false);

  const isDragging = useStore((state) => {
    const thisNode = state.nodes.find((node) => node.id === taskNode.nodeId);
    return thisNode?.dragging || false;
  });

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scrollHeight, setScrollHeight] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState(false);

  const { name, state, callbacks, nodeId, taskSpec } = taskNode;
  const { dimensions, selected, highlighted, isCustomComponent } = state;

  const onNotify = useCallback((message: NotifyMessage) => {
    switch (message.type) {
      case "highlight":
        setHighlighted(true);
        break;
      case "clear":
        setHighlighted(false);
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

  const taskConfigMarkup = useMemo(
    () => (
      <TaskConfiguration
        taskNode={taskNode}
        key={nodeId}
        actions={[
          {
            children: (
              <div className="flex items-center gap-2">
                <CopyIcon />
              </div>
            ),
            variant: "secondary",
            tooltip: "Duplicate Task",
            onClick: callbacks.onDuplicate,
          },
          {
            children: (
              <div className="flex items-center gap-2">
                <CircleFadingArrowUp />
              </div>
            ),
            variant: "secondary",
            className: cn(isCustomComponent && "hidden"),
            tooltip: "Update Task from Source URL",
            onClick: callbacks.onUpgrade,
          },
        ]}
      />
    ),
    [nodeId, callbacks.onDuplicate, callbacks.onUpgrade, isCustomComponent],
  );

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

  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 break-words p-0 drop-shadow-none gap-2",
        selected ? "border-gray-500" : "hover:border-slate-200",
        (highlighted || highlightedState) && "border-orange-500",
      )}
      style={{
        width: dimensions.w + "px",
        height: condensed || !dimensions.h ? "auto" : dimensions.h + "px",
        transition: "height 0.2s",
      }}
      ref={nodeRef}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5 flex flex-row justify-between items-center">
        <CardTitle className="break-words text-left text-xs text-slate-900">
          {name}
        </CardTitle>

        {taskSpec.componentRef?.digest && (
          <div className="text-xs text-muted-foreground font-light font-mono">
            {taskSpec.componentRef.digest.substring(0, 8)}
          </div>
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
      </CardContent>
    </Card>
  );
};

export default TaskNodeCard;
