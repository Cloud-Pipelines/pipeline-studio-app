import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTaskNode } from "@/providers/TaskNodeProvider";

import TaskConfigurationSheet from "../TaskConfigurationSheet";
import { TaskNodeInputs } from "./TaskNodeInputs";
import { TaskNodeOutputs } from "./TaskNodeOutputs";

const TaskNodeCard = () => {
  const { name, state, callbacks } = useTaskNode();

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
  const [focusedIo, setFocusedIo] = useState<boolean>(false);

  const [scrollHeight, setScrollHeight] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState(false);

  const { dimensions, selected, highlighted, isCustomComponent } = state;

  const handleCardClick = useCallback(() => {
    if (!isComponentEditorOpen) {
      setIsComponentEditorOpen(true);
    }
  }, [isComponentEditorOpen]);

  const handleIOClicked = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    setFocusedIo(true);
    setIsComponentEditorOpen(true);
  }, []);

  const handleNodeDuplication = useCallback(() => {
    callbacks.onDuplicate?.();
    setIsComponentEditorOpen(false);
  }, [callbacks]);

  const handleTaskConfigurationSheetOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setFocusedIo(false);
      }
      setIsComponentEditorOpen(isOpen);
    },
    [],
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

  return (
    <>
      <Card
        className={cn(
          "rounded-2xl border-gray-200 border-2 break-words p-0 drop-shadow-none gap-2",
          selected ? "border-gray-500" : "hover:border-slate-200",
          highlighted && "border-orange-500",
        )}
        style={{
          width: dimensions.w + "px",
          height: condensed || !dimensions.h ? "auto" : dimensions.h + "px",
          transition: "height 0.2s",
        }}
        ref={nodeRef}
        onClick={handleCardClick}
      >
        <CardHeader className="border-b border-slate-200 px-2 py-2.5">
          <CardTitle className="break-words text-left text-xs text-slate-900">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex flex-col gap-2">
          <div
            className="flex flex-col gap-2"
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
              handleIOClicked={handleIOClicked}
            />

            <TaskNodeOutputs
              condensed={condensed}
              expanded={expandedOutputs}
              onBackgroundClick={handleOutputSectionClick}
              handleIOClicked={handleIOClicked}
            />
          </div>
        </CardContent>
      </Card>

      <TaskConfigurationSheet
        focusedIo={focusedIo}
        isOpen={isComponentEditorOpen}
        onOpenChange={handleTaskConfigurationSheetOpenChange}
        actions={[
          {
            children: (
              <div className="flex items-center gap-2">
                <CopyIcon />
              </div>
            ),
            variant: "secondary",
            tooltip: "Duplicate Task",
            onClick: handleNodeDuplication,
          },
          {
            children: (
              <div className="flex items-center gap-2">
                <CircleFadingArrowUp />
              </div>
            ),
            variant: "secondary",
            className: cn(isCustomComponent && "hidden"), // Update button is hidden for custom components, since they don't have a source URL
            tooltip: "Update Task from Source URL",
            onClick: callbacks.onUpgrade,
          },
        ]}
      />
    </>
  );
};

export default TaskNodeCard;
