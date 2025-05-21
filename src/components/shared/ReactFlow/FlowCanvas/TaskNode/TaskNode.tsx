import type { NodeProps } from "@xyflow/react";
import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import {
  memo,
  type MouseEvent,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { useDynamicFontSize } from "@/hooks/useDynamicFontSize";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { inputsWithInvalidArguments } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type {
  ArgumentType,
  ComponentSpec,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import { InputHandle, OutputHandle } from "./Handles";
import { StatusIndicator } from "./StatusIndicator";
import TaskConfigurationSheet from "./TaskConfigurationSheet";

type TaskNodeContentProps = {
  componentSpec: ComponentSpec;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  invalidArguments: string[];
  selected: boolean;
  nodeRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  highlighted?: boolean;
  onIOClick: () => void;
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
  onIOClick,
}: TaskNodeContentProps) => {
  const handleIOClicked = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    onIOClick();
  };

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
                onClick={handleIOClicked}
              />
            ))}
          </div>
        )}
        {outputs.length > 0 && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            {outputs.map((output) => (
              <OutputHandle
                key={output.name}
                output={output}
                onClick={handleIOClicked}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ComponentTaskNode = ({ data, selected }: NodeProps) => {
  const { taskStatusMap } = useComponentSpec();
  const [focusedIo, setFocusedIo] = useState<boolean>(false);

  const [isComponentEditorOpen, setIsComponentEditorOpen] = useState(false);
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

  const runStatus = taskStatusMap.get(taskId ?? "") as ContainerExecutionStatus;

  const isCustomComponent = !taskSpec.componentRef.url; // Custom components don't have a source url

  const { componentRef: mostRecentComponentRef } = useComponentFromUrl(
    taskSpec.componentRef.url,
  );

  const isOutdated =
    taskSpec.componentRef.digest !== mostRecentComponentRef.digest;

  if (componentSpec === undefined) {
    return null;
  }

  const inputs = componentSpec.inputs || [];
  const outputs = componentSpec.outputs || [];
  const invalidArguments = inputsWithInvalidArguments(inputs, taskSpec);

  const handleClick = () => {
    if (!isComponentEditorOpen) {
      setIsComponentEditorOpen(true);
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

  const handleUpgradeTaskNode = () => {
    if (!isOutdated) {
      notify("Component version already matches source URL", "info");
      return;
    }

    typedData.callbacks?.onUpgrade(mostRecentComponentRef);
  };

  const handleIOClick = () => {
    setFocusedIo(true);
    setIsComponentEditorOpen(true);
  };

  const handleTaskConfigurationSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFocusedIo(false);
    }
    setIsComponentEditorOpen(isOpen);
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
        onIOClick={handleIOClick}
      />

      {typedData.taskId && (
        <>
          <TaskConfigurationSheet
            taskId={typedData.taskId}
            taskSpec={taskSpec}
            isOpen={isComponentEditorOpen}
            onOpenChange={handleTaskConfigurationSheetOpenChange}
            onDelete={handleDeleteTaskNode}
            readOnly={readOnly}
            runStatus={runStatus}
            focusedIo={focusedIo}
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
              {
                children: (
                  <div className="flex items-center gap-2">
                    <CircleFadingArrowUp />
                  </div>
                ),
                variant: "secondary",
                className: cn(isCustomComponent && "hidden"), // Update button is hidden for custom components, since they don't have a source URL
                tooltip: "Update Task from Source URL",
                onClick: handleUpgradeTaskNode,
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
