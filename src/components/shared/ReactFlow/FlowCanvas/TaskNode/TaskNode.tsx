import { type NodeProps } from "@xyflow/react";
import { memo, useMemo } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import {
  getTaskStatus,
  useCurrentExecution,
} from "@/providers/CurrentExecutionProvider";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import type { TaskNodeData } from "@/types/taskNode";

import { StatusIndicator } from "./StatusIndicator";
import { TaskNodeCard } from "./TaskNodeCard";

const TaskNode = ({ data, selected }: NodeProps) => {
  const { details, state } = useCurrentExecution();

  const typedData = useMemo(() => data as TaskNodeData, [data]);

  const runStatus = getTaskStatus(
    details,
    state,
    typedData.taskId ?? "",
  ) as ContainerExecutionStatus;

  return (
    <TaskNodeProvider
      data={typedData}
      selected={selected}
      runStatus={runStatus}
    >
      <StatusIndicator status={runStatus} />
      <TaskNodeCard />
    </TaskNodeProvider>
  );
};

export default memo(TaskNode);
