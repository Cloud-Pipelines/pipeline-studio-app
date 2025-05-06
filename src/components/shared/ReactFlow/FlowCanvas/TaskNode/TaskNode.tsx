import type { HandleType, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { CopyIcon } from "lucide-react";
import {
  type CSSProperties,
  memo,
  type ReactElement,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDynamicFontSize } from "@/hooks/useDynamicFontSize";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { TaskNodeData } from "@/types/taskNode";
import type {
  ArgumentType,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import TaskConfigurationSheet from "./TaskConfigurationSheet";
import TaskDetailsSheet from "./TaskDetailsSheet";

const inputHandlePosition = Position.Top;
const outputHandlePosition = Position.Bottom;

type InputOrOutputSpec = InputSpec | OutputSpec;

const NODE_WIDTH_IN_PX = 200;

function generateHandles(
  ioSpecs: InputOrOutputSpec[],
  handleType: HandleType,
  position: Position,
  idPrefix: string,
  inputsWithMissingArguments?: string[],
): ReactElement[] {
  const handleComponents = [];
  const numHandles = ioSpecs.length;
  for (let i = 0; i < numHandles; i++) {
    const ioSpec = ioSpecs[i];
    const id = idPrefix + ioSpec.name;
    const relativePosition = (i + 1) / (numHandles + 1);
    const positionPercentString = String(100 * relativePosition) + "%";
    const style =
      position === Position.Top || position === Position.Bottom
        ? { left: positionPercentString }
        : { top: positionPercentString };
    const ioTypeName = ioSpec.type?.toString() ?? "Any";
    let classNames = [`handle_${idPrefix}${ioTypeName}`.replace(/ /g, "_")];

    const isInvalid = (inputsWithMissingArguments ?? []).includes(ioSpec.name);
    classNames = classNames.map((className) => className.replace(/ /g, "_"));

    const [labelClasses, labelStyle] = generateLabelStyle(position, numHandles);
    const handleTitle =
      ioSpec.name + " : " + ioTypeName + "\n" + (ioSpec.description || "");
    handleComponents.push(
      <Handle
        key={id}
        type={handleType}
        position={position}
        id={id}
        style={style}
        isConnectable={true}
        title={handleTitle}
        className={cn(
          classNames.join(" "),
          "w-3! h-3! border-2! rounded-full!",
          isInvalid
            ? "border-rose-500! bg-rose-50!"
            : "bg-white! border-slate-300! hover:border-slate-600!",
        )}
      >
        <div className={labelClasses} style={labelStyle}>
          {ioSpec.name}
        </div>
      </Handle>,
    );
  }
  return handleComponents;
}

function generateLabelStyle(
  position: Position,
  numHandles: number,
): [string, CSSProperties] {
  let maxLabelWidthPx = NODE_WIDTH_IN_PX;
  let labelClasses = "label";

  if (position === Position.Top || position === Position.Bottom) {
    if (numHandles > 1) {
      maxLabelWidthPx = NODE_WIDTH_IN_PX / (numHandles + 1);
    }
    if (maxLabelWidthPx < 35) {
      maxLabelWidthPx = 50;
      labelClasses += " label-angled p-1";
    }
  } else {
    maxLabelWidthPx = 60;
  }

  labelClasses += " truncate text-xs hover:!overflow-visible hover:font-medium";

  const labelStyle: CSSProperties = { maxWidth: `${maxLabelWidthPx}px` };
  return [labelClasses, labelStyle];
}

function generateInputHandles(
  inputSpecs: InputSpec[],
  inputsWithInvalidArguments?: string[],
): ReactElement[] {
  return generateHandles(
    inputSpecs,
    "target",
    inputHandlePosition,
    "input_",
    inputsWithInvalidArguments,
  );
}

function generateOutputHandles(outputSpecs: OutputSpec[]): ReactElement[] {
  return generateHandles(
    outputSpecs,
    "source",
    outputHandlePosition,
    "output_",
  );
}

const ComponentTaskNode = ({ data, selected }: NodeProps) => {
  const { taskStatusMap } = useComponentSpec();
  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
  const [isTaskDetailsSheetOpen, setIsTaskDetailsSheetOpen] = useState(false);
  const taskId = useMemo(
    () => data?.taskId as string | undefined,
    [data?.taskId],
  );
  const nodeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useDynamicFontSize(textRef);

  const notify = useToastNotification();

  const typedData = data as TaskNodeData;
  const taskSpec = typedData.taskSpec as TaskSpec;
  const componentSpec = taskSpec.componentRef.spec;

  const readOnly = typedData.readOnly;

  const runStatus = taskStatusMap.get(taskId ?? "");

  if (componentSpec === undefined) {
    return null;
  }

  const label = componentSpec.name ?? "<component>";
  let title = "Task ID: " + typedData.taskId;
  if (componentSpec.name) {
    title += "\nComponent: " + componentSpec.name;
  }
  if (taskSpec.componentRef.url) {
    title += "\nUrl: " + taskSpec.componentRef.url;
  }
  if (taskSpec.componentRef.digest) {
    title += "\nDigest: " + taskSpec.componentRef.digest;
  }
  if (componentSpec.description) {
    title += "\nDescription: " + componentSpec.description;
  }
  const inputsWithInvalidArguments = (componentSpec.inputs ?? [])
    .filter(
      (inputSpec) =>
        inputSpec.optional !== true &&
        inputSpec.default === undefined &&
        !(inputSpec.name in (taskSpec.arguments ?? {})),
    )
    .map((inputSpec) => inputSpec.name);
  const inputHandles = generateInputHandles(
    componentSpec.inputs ?? [],
    inputsWithInvalidArguments,
  );
  const outputHandles = generateOutputHandles(componentSpec.outputs ?? []);
  const handleComponents = inputHandles.concat(outputHandles);

  const getBorderColor = () => {
    switch (runStatus) {
      case "SUCCEEDED":
        return "border-emerald-500";
      case "FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "border-rose-500";
      case "RUNNING":
      case "STARTING":
        return "border-sky-500 animate-pulse duration-2000";
      case "PENDING":
        return "border-yellow-500 animate-pulse duration-2000";
      case "CANCELLING":
        return "border-orange-500 animate-pulse duration-2000";
      case "CANCELLED":
        return "border-orange-500";
      case "SKIPPED":
        return "border-slate-400";
      case "QUEUED":
        return "border-yellow-500";
      case "UNINITIALIZED":
      case "WAITING_FOR_UPSTREAM":
        return "border-slate-300";
      default:
        return "border-slate-300";
    }
  };

  const getBgColor = () => {
    switch (runStatus) {
      case "SUCCEEDED":
        return "bg-emerald-50";
      case "FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "bg-rose-50";
      case "RUNNING":
      case "STARTING":
        return "bg-sky-50";
      case "PENDING":
        return "bg-yellow-50";
      case "CANCELLING":
        return "bg-orange-50";
      case "CANCELLED":
        return "bg-orange-50";
      case "SKIPPED":
        return "bg-slate-100";
      case "QUEUED":
        return "bg-yellow-50";
      case "UNINITIALIZED":
      case "WAITING_FOR_UPSTREAM":
        return "bg-white";
      default:
        return "bg-white";
    }
  };

  const handleClick = () => {
    if (!isComponentEditorOpen && !readOnly) {
      setIsComponentEditorOpen(true);
    }
    if (!isTaskDetailsSheetOpen && readOnly) {
      setIsTaskDetailsSheetOpen(true);
    }
  };

  const handleSetArguments = (args: Record<string, ArgumentType>) => {
    typedData.callbacks?.setArguments(args);
    notify("Arguments updated", "success");
  };

  const handleDeleteTaskNode = () => {
    typedData.callbacks?.onDelete();
  };

  const handleDuplicateTaskNode = () => {
    typedData.callbacks?.onDuplicate();
    setIsComponentEditorOpen(false);
  };

  const handleTaskDetailsSheetClose = () => {
    setIsTaskDetailsSheetOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "border rounded-md shadow-sm transition-all duration-200",
          getBorderColor(),
          getBgColor(),
          selected ? "border-sky-500" : " hover:border-slate-400",
        )}
        style={{ width: `${NODE_WIDTH_IN_PX}px` }}
        ref={nodeRef}
        onClick={handleClick}
      >
        <div className="p-3 flex items-center justify-between">
          <div
            className="font-medium text-gray-800 whitespace-nowrap w-full text-center"
            title={title}
            ref={textRef}
          >
            {label}
          </div>
          {handleComponents}
        </div>
      </div>

      {typedData.taskId && (
        <>
          <TaskDetailsSheet
            isOpen={isTaskDetailsSheetOpen}
            taskSpec={taskSpec}
            taskId={typedData.taskId}
            runStatus={runStatus}
            onClose={handleTaskDetailsSheetClose}
          />

          <TaskConfigurationSheet
            taskId={typedData.taskId}
            taskSpec={taskSpec}
            isOpen={isComponentEditorOpen}
            onOpenChange={setIsComponentEditorOpen}
            onDelete={handleDeleteTaskNode}
            actions={[
              {
                children: (
                  <div className="flex items-center gap-2">
                    <CopyIcon />
                  </div>
                ),
                variant: "secondary",
                className: "cursor-pointer",
                tooltip: "Duplicate Task",
                onClick: handleDuplicateTaskNode,
              },
            ]}
            setArguments={handleSetArguments}
            disabled={!!runStatus}
          />
        </>
      )}
    </>
  );
};

export default memo(ComponentTaskNode);
