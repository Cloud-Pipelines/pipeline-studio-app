import { type NodeProps } from "@xyflow/react";
import { memo, useMemo } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { useTaskStatusMap } from "@/providers/PipelineRunProvider";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import type { TaskNodeData } from "@/types/taskNode";
import { isCacheDisabled } from "@/utils/cache";

import { StatusIndicator } from "./StatusIndicator";
import { TaskNodeCard } from "./TaskNodeCard";

const TaskNode = ({ data, selected }: NodeProps) => {
  const taskStatusMap = useTaskStatusMap();
  const typedData = useMemo(() => data as TaskNodeData, [data]);

  const executionStatus = taskStatusMap?.get(typedData.taskId ?? "") as
    | ContainerExecutionStatus
    | undefined;

  const disabledCache = isCacheDisabled(typedData.taskSpec);

  return (
    <TaskNodeProvider
      data={typedData}
      selected={selected}
      status={executionStatus}
    >
      <StatusIndicator status={executionStatus} disabledCache={disabledCache} />
      <TaskNodeCard />
    </TaskNodeProvider>
  );
};

export default memo(TaskNode);
