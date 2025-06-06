import { type NodeProps } from "@xyflow/react";
import { memo, useMemo } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { TaskNodeData } from "@/types/taskNode";

import { StatusIndicator } from "./StatusIndicator";
import { TaskNodeCard } from "./TaskNodeCard";
import { TaskNodeProvider } from "./TaskNodeProvider";

const ComponentTaskNode = ({ data, selected }: NodeProps) => {
  const { taskStatusMap } = useComponentSpec();

  const typedData = useMemo(() => data as TaskNodeData, [data]);

  const runStatus = taskStatusMap.get(
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

export default memo(ComponentTaskNode);
