import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import {
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  CopyIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { memo, type RefObject, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDynamicFontSize } from "@/hooks/useDynamicFontSize";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { inputsWithInvalidArguments } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type {
  ArgumentType,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import TaskConfigurationSheet from "./TaskConfigurationSheet";
import TaskDetailsSheet from "./TaskDetailsSheet";

type RunStatusType =
  | "SUCCEEDED"
  | "FAILED"
  | "SYSTEM_ERROR"
  | "INVALID"
  | "UPSTREAM_FAILED"
  | "UPSTREAM_FAILED_OR_SKIPPED"
  | "RUNNING"
  | "STARTING"
  | "PENDING"
  | "CANCELLING"
  | "CANCELLED"
  | "SKIPPED"
  | "QUEUED"
  | "UNINITIALIZED"
  | "WAITING_FOR_UPSTREAM"
  | string;

type StatusIndicatorProps = {
  status: RunStatusType | undefined;
};

const getRunStatus = (status: RunStatusType) => {
  switch (status) {
    case "SUCCEEDED":
      return {
        style: "bg-emerald-500",
        text: "Succeeded",
        icon: <CheckCircleIcon className="w-2 h-2" />,
      };
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
    case "UPSTREAM_FAILED":
    case "UPSTREAM_FAILED_OR_SKIPPED":
      return {
        style: "bg-red-700",
        text: "Failed",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "RUNNING":
    case "STARTING":
      return {
        style: "bg-sky-500",
        text: "Running",
        icon: <Loader2Icon className="w-2 h-2 animate-spin" />,
      };
    case "PENDING":
      return {
        style: "bg-yellow-500",
        text: "Pending",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    case "CANCELLING":
    case "CANCELLED":
      return {
        style: "bg-orange-500",
        text: status === "CANCELLING" ? "Cancelling" : "Cancelled",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "SKIPPED":
      return {
        style: "bg-slate-400",
        text: "Skipped",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "QUEUED":
      return {
        style: "bg-yellow-500",
        text: "Queued",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    case "UNINITIALIZED":
    case "WAITING_FOR_UPSTREAM":
      return {
        style: "bg-slate-500",
        text: "Waiting for upstream",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    default:
      return {
        style: "bg-slate-300",
        text: "Unknown",
        icon: <CircleDashedIcon className="w-2 h-2" />,
      };
  }
};

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (!status) return null;

  const { style, text, icon } = getRunStatus(status);

  return (
    <div
      className={cn(
        "absolute -z-1 -top-5 left-0 h-[35px] rounded-t-md px-2.5 py-1 text-[10px]",
        style,
      )}
    >
      <div className="flex items-center gap-1 font-mono text-white">
        {icon}
        {text}
      </div>
    </div>
  );
};

type InputHandleProps = {
  input: InputSpec;
  invalidArguments: string[];
};

const InputHandle = ({ input, invalidArguments }: InputHandleProps) => {
  const required = !input.optional;
  const isInvalid = invalidArguments.includes(input.name);
  const missing = isInvalid ? "bg-red-700!" : "bg-gray-500!";

  return (
    <div className="flex flex-row items-center" key={input.name}>
      <Handle
        type="target"
        id={`input_${input.name}`}
        position={Position.Left}
        isConnectable={true}
        className={`
          relative!
          border-0!
          !w-[12px]
          !h-[12px]
          transform-none!
          -translate-x-6
          ${missing}
          `}
      />

      <div className="text-xs mr-4 text-gray-800! max-w-[250px] truncate bg-gray-200 rounded-md px-2 py-1 -translate-x-3">
        {required && <span className="text-xs text-red-700 mr-1">*</span>}
        {input.name.replace(/_/g, " ")}
      </div>
    </div>
  );
};

type OutputHandleProps = {
  output: OutputSpec;
};

const OutputHandle = ({ output }: OutputHandleProps) => {
  return (
    <div className="flex flex-row-reverse items-center" key={output.name}>
      <Handle
        type="source"
        id={`output_${output.name}`}
        position={Position.Right}
        isConnectable={true}
        className={`
          relative!
          border-0!
          !w-[12px]
          !h-[12px]
          transform-none!
          translate-x-6
          bg-gray-500!
          `}
      />
      <div className="text-xs text-gray-800! max-w-[250px] truncate bg-gray-200 rounded-md px-2 py-1 translate-x-3">
        {output.name.replace(/_/g, " ")}
      </div>
    </div>
  );
};

type TaskNodeContentProps = {
  componentSpec: any;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  invalidArguments: string[];
  selected: boolean;
  nodeRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  highlighted?: boolean;
};

const TaskNodeContent = ({
  componentSpec,
  inputs = [],
  outputs = [],
  invalidArguments,
  selected,
  nodeRef,
  onClick,
  highlighted,
}: TaskNodeContentProps) => {
  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 max-w-[300px] min-w-[300px] break-words p-0 drop-shadow-none gap-2",
        selected ? "border-gray-500" : "hover:border-slate-200",
        highlighted && "border-orange-500",
      )}
      ref={nodeRef}
      onClick={onClick}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {componentSpec.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        {inputs.length > 0 && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            {inputs.map((input) => (
              <InputHandle
                key={input.name}
                input={input}
                invalidArguments={invalidArguments}
              />
            ))}
          </div>
        )}
        {outputs.length > 0 && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            {outputs.map((output) => (
              <OutputHandle key={output.name} output={output} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ComponentTaskNode = ({ data, selected }: NodeProps) => {
  const { taskStatusMap } = useComponentSpec();
  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
  const [isTaskDetailsSheetOpen, setIsTaskDetailsSheetOpen] = useState(false);
  const taskId = useMemo(
    () => data?.taskId as string | undefined,
    [data?.taskId],
  );
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useDynamicFontSize(textRef);

  const notify = useToastNotification();

  const typedData = data as TaskNodeData;
  const taskSpec = typedData.taskSpec as TaskSpec;
  const componentSpec = taskSpec.componentRef.spec;
  const readOnly = typedData.readOnly;
  const highlighted = typedData.highlighted;

  const runStatus = taskStatusMap.get(taskId ?? "");

  if (componentSpec === undefined) {
    return null;
  }

  const inputs = componentSpec.inputs || [];
  const outputs = componentSpec.outputs || [];
  const invalidArguments = inputsWithInvalidArguments(inputs, taskSpec);

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
      <StatusIndicator status={runStatus} />

      <TaskNodeContent
        componentSpec={componentSpec}
        inputs={inputs}
        outputs={outputs}
        invalidArguments={invalidArguments}
        selected={selected}
        nodeRef={nodeRef}
        onClick={handleClick}
        highlighted={highlighted ?? false}
      />

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
