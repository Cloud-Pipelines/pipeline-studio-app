import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { CopyIcon } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDynamicFontSize } from "@/hooks/useDynamicFontSize";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { TaskNodeData } from "@/types/taskNode";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";
import { replaceUnderscoresWithSpaces } from "@/utils/string";

import TaskConfigurationSheet from "./TaskConfigurationSheet";
import TaskDetailsSheet from "./TaskDetailsSheet";

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
  const highlighted = typedData.highlighted;

  const runStatus = taskStatusMap.get(taskId ?? "");

  if (componentSpec === undefined) {
    return null;
  }

  const inputs = componentSpec.inputs;
  const outputs = componentSpec.outputs;

  const inputHandles = inputs?.map((input) => {
    return (
      <div className="flex flex-row items-center" key={input.name}>
        <Handle
          type="target"
          id={`input_${input.name}`}
          position={Position.Left}
          isConnectable={true}
          className="
            relative!
            border-4!
            !w-4
            !h-4
            transform-none!
            -translate-x-2.5
            bg-stone-900!
            border-slate-100!
            "
        />

        <div className="text-xs mr-4 text-slate-900">
          {replaceUnderscoresWithSpaces(input.name)}
        </div>
      </div>
    );
  });

  const outputHandles = outputs?.map((output) => {
    return (
      <div className="flex flex-row-reverse items-center" key={output.name}>
        <Handle
          type="source"
          id={`output_${output.name}`}
          position={Position.Right}
          isConnectable={true}
          className="relative! border-4! !w-4 !h-4 transform-none! translate-x-2.5 bg-stone-900! border-slate-100!"
        />

        <div className="text-xs ml-4 text-slate-900">
          {replaceUnderscoresWithSpaces(output.name)}
        </div>
      </div>
    );
  });

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
      <Card
        className={cn(
          "rounded border-slate-50 border-2",
          selected
            ? "drop-shadow-[0_0_5px_rgba(0,162,235,0.5)]"
            : "hover:border-slate-200",
          highlighted && "border-orange-500",
        )}
        ref={nodeRef}
        onClick={handleClick}
      >
        <CardHeader>
          <CardTitle>{componentSpec.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-0">
          {inputHandles}
          {outputHandles}
        </CardContent>
      </Card>

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
