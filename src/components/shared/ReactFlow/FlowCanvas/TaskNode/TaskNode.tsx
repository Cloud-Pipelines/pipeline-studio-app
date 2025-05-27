import type { NodeProps } from "@xyflow/react";
import { CircleFadingArrowUp, CopyIcon } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { useDynamicFontSize } from "@/hooks/useDynamicFontSize";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { inputsWithInvalidArguments } from "@/services/componentService";
import type { Annotations } from "@/types/annotations";
import type { TaskNodeData } from "@/types/taskNode";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

import { StatusIndicator } from "./StatusIndicator";
import TaskConfigurationSheet from "./TaskConfigurationSheet";
import { TaskNodeCard } from "./TaskNodeCard";

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
  const highlighted = typedData.highlighted ?? false;

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

  const handleSetAnnotations = (annotations: Annotations) => {
    typedData.callbacks?.setAnnotations(annotations);
    notify("Annotations updated", "success");
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

      <TaskNodeCard
        componentSpec={componentSpec}
        inputs={inputs}
        outputs={outputs}
        invalidArguments={invalidArguments}
        values={typedData.taskSpec?.arguments}
        selected={selected}
        highlighted={highlighted}
        nodeRef={nodeRef}
        onClick={handleClick}
        onIOClick={handleIOClick}
      />

      {taskId && (
        <>
          <TaskConfigurationSheet
            taskId={taskId}
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
            setAnnotations={handleSetAnnotations}
            disabled={!!runStatus}
          />
        </>
      )}
    </>
  );
};

export default memo(ComponentTaskNode);
