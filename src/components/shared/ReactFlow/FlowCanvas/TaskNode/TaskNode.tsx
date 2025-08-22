import { type NodeProps } from "@xyflow/react";
import { memo, useMemo } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { useBackend } from "@/providers/BackendProvider";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import {
  usePipelineRunDetailsQuery,
  usePipelineRunStateQuery,
} from "@/services/executionService";
import type { TaskNodeData } from "@/types/taskNode";

import { StatusIndicator } from "./StatusIndicator";
import { TaskNodeCard } from "./TaskNodeCard";

const usePipelineRunState = (taskId: string) => {
  const { backendUrl } = useBackend();
  const { id: rootExecutionId } = runDetailRoute.useParams() as RunDetailParams;

  const { data: details } = usePipelineRunDetailsQuery(
    rootExecutionId,
    backendUrl,
  );

  const { data: taskState } = usePipelineRunStateQuery(
    rootExecutionId,
    backendUrl,
  );

  return useMemo(() => {
    const taskExecutionId = details?.child_task_execution_ids[taskId];
    return Object.keys(
      taskState?.child_execution_status_stats[taskExecutionId ?? ""] ?? {},
    ).pop() as ContainerExecutionStatus;
  }, [details, taskState, taskId]);
};

const TaskNode = ({ data, selected }: NodeProps) => {
  const typedData = useMemo(() => data as TaskNodeData, [data]);

  const status = usePipelineRunState(typedData.taskId ?? "");

  console.log(`runStatus ${typedData.taskId}`, status);

  // const status = "INVALID"; // todo - remove with proper status

  return (
    <TaskNodeProvider data={typedData} selected={selected} status={status}>
      {status && <StatusIndicator status={status} />}
      <TaskNodeCard />
    </TaskNodeProvider>
  );
};

export default memo(TaskNode);
