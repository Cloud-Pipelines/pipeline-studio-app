import {
  type MouseEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ArgumentType,
  ComponentSpec,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import { TaskNodeInputs } from "./TaskNodeInputs";
import { TaskNodeOutputs } from "./TaskNodeOutputs";

type TaskNodeCardProps = {
  componentSpec: ComponentSpec;
  taskSpec: TaskSpec;
  taskId?: string;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  values?: Record<string, ArgumentType>;
  invalidArguments: string[];
  selected: boolean;
  highlighted?: boolean;
  nodeRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  onIOClick: () => void;
};

const DEFAULT_DIMENSIONS = {
  w: 300,
  h: undefined,
};

const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;

type EditorPosition = {
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  w?: string;
  h?: string;
};

const TaskNodeCard = ({
  componentSpec,
  taskSpec,
  taskId = "",
  inputs = [],
  outputs = [],
  values,
  invalidArguments,
  selected,
  highlighted,
  nodeRef,
  onClick,
  onIOClick,
}: TaskNodeCardProps) => {
  const [scrollHeight, setScrollHeight] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const handleIOClicked = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    onIOClick();
  };

  let annotatedDimensions;
  try {
    const parsed = JSON.parse(
      taskSpec.annotations?.["editor.position"] as string,
    ) as EditorPosition | undefined;

    if (parsed) {
      const width = parsed.width ?? parsed.w;
      const height = parsed.height ?? parsed.h;

      annotatedDimensions = {
        x: !isNaN(Number(parsed.x)) ? parsed.x : undefined,
        y: !isNaN(Number(parsed.y)) ? parsed.y : undefined,
        width: !isNaN(Number(width)) ? width : undefined,
        height: !isNaN(Number(height)) ? height : undefined,
      };
    } else {
      annotatedDimensions = undefined;
    }
  } catch {
    annotatedDimensions = undefined;
  }

  const dimensions = annotatedDimensions
    ? {
        w: Math.max(
          parseInt(annotatedDimensions.width ?? "") || DEFAULT_DIMENSIONS.w,
          MIN_WIDTH,
        ),
        h:
          Math.max(parseInt(annotatedDimensions.height ?? ""), MIN_HEIGHT) ||
          DEFAULT_DIMENSIONS.h,
      }
    : DEFAULT_DIMENSIONS;

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
      onClick={onClick}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="break-words text-left text-xs text-slate-900">
          {componentSpec.name}
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
            inputs={inputs}
            invalidArguments={invalidArguments}
            values={values}
            condensed={condensed}
            expanded={expandedInputs}
            onBackgroundClick={handleInputSectionClick}
            handleIOClicked={handleIOClicked}
          />

          <TaskNodeOutputs
            outputs={outputs}
            taskId={taskId}
            condensed={condensed}
            expanded={expandedOutputs}
            onBackgroundClick={handleOutputSectionClick}
            handleIOClicked={handleIOClicked}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskNodeCard;
