import { useStore } from "@xyflow/react";
import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { useTaskNode } from "@/providers/TaskNodeProvider";
import type { Annotations } from "@/types/annotations";

import replaceTaskAnnotationsInGraphSpec from "../../utils/replaceTaskAnnotationsInGraphSpec";
import TaskConfiguration from "../TaskConfiguration";
import { TaskNodeInputs } from "./TaskNodeInputs";
import { TaskNodeOutputs } from "./TaskNodeOutputs";

const TaskNodeCard = () => {
  const taskNode = useTaskNode();
  const { setContent, clearContent } = useContextPanel();
  const { graphSpec, updateGraphSpec } = useComponentSpec();

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
  const [highlightActive, setHighlightActive] = useState(false);

  const { name, state, callbacks, nodeId, taskSpec } = taskNode;
  const { dimensions, selected, highlighted, isCustomComponent } = state;

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

  const setHighlightSimilarTasks = useCallback(
    (highlight: boolean) => {
      setHighlightActive(highlight);

      const taskId = taskNode.taskId;
      const digest = graphSpec.tasks[taskId]?.componentRef?.digest;

      if (!digest) {
        return;
      }

      let updatedGraphSpec = { ...graphSpec };

      // Update annotations for all tasks with matching digest
      Object.keys(graphSpec.tasks).forEach((currentTaskId) => {
        const task = graphSpec.tasks[currentTaskId];
        const taskDigest = task?.componentRef?.digest;
        const newAnnotations = { ...task.annotations };

        newAnnotations["editor.highlight"] = false;

        if (taskDigest === digest && highlight) {
          newAnnotations["editor.highlight"] = true;
        }

        updatedGraphSpec = replaceTaskAnnotationsInGraphSpec(
          currentTaskId,
          updatedGraphSpec,
          newAnnotations as Annotations,
        );
      });

      updateGraphSpec(updatedGraphSpec);
    },
    [graphSpec, updateGraphSpec],
  );

  const handleToggleHighlightSimilarTasks = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      const newHighlightState = !highlightActive;
      setHighlightSimilarTasks(newHighlightState);
    },
    [highlightActive, setHighlightSimilarTasks],
  );

  useEffect(() => {
    if (!highlightActive) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
        setHighlightSimilarTasks(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHighlightSimilarTasks(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [highlightActive, setHighlightSimilarTasks]);

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

  useEffect(() => {
    setHighlightSimilarTasks(false);
  }, []);

  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 break-words p-0 drop-shadow-none gap-2",
        selected ? "border-gray-500" : "hover:border-slate-200",
        highlighted && "border-orange-500 hover:border-orange-500",
        highlighted && selected && "border-orange-700 hover:border-orange-700",
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
          <div
            className={cn(
              "text-xs text-muted-foreground font-light hover:text-warning cursor-pointer",
              highlighted && "text-warning",
            )}
            onClick={handleToggleHighlightSimilarTasks}
          >
            {taskSpec.componentRef.digest.substring(0, 8)}...
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
