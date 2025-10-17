import { useReactFlow } from "@xyflow/react";
import { type ReactNode, useCallback, useMemo } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { useNodeManager } from "@/hooks/useNodeManager";
import { useTaskNodeDimensions } from "@/hooks/useTaskNodeDimensions";
import useToastNotification from "@/hooks/useToastNotification";
import type { Annotations } from "@/types/annotations";
import type { TaskNodeData } from "@/types/nodes";
import type { TaskNodeDimensions } from "@/types/nodes";
import type {
  ArgumentType,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { getComponentName } from "@/utils/getComponentName";

import {
  createRequiredContext,
  useRequiredContext,
} from "../hooks/useRequiredContext";

type TaskNodeCallbacks = {
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpgrade: () => void;
};

type TaskNodeState = Readonly<{
  selected: boolean;
  highlighted: boolean;
  readOnly: boolean;
  disabled: boolean;
  connectable: boolean;
  runStatus?: ContainerExecutionStatus;
  isCustomComponent: boolean;
  dimensions: TaskNodeDimensions;
}>;

type TaskNodeProviderProps = {
  children: ReactNode;
  data: TaskNodeData;
  selected: boolean;
  runStatus?: ContainerExecutionStatus;
};

export type TaskNodeContextType = {
  taskSpec: TaskSpec;
  taskId: string;
  nodeId: string;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  name: string;
  state: TaskNodeState;
  callbacks: TaskNodeCallbacks;
  select: () => void;
};

const TaskNodeContext =
  createRequiredContext<TaskNodeContextType>("TaskNodeProvider");

export const TaskNodeProvider = ({
  children,
  data,
  selected,
  runStatus,
}: TaskNodeProviderProps) => {
  const notify = useToastNotification();
  const reactFlowInstance = useReactFlow();
  const { getTaskNodeId } = useNodeManager();

  const taskSpec = data.taskSpec ?? ({} as TaskSpec);
  const taskId = data.taskId as string;
  const nodeId = getTaskNodeId(taskId);

  const inputs = taskSpec.componentRef.spec?.inputs || [];
  const outputs = taskSpec.componentRef.spec?.outputs || [];

  const name = getComponentName(taskSpec.componentRef);

  const isCustomComponent = !taskSpec.componentRef.url; // Custom components don't have a source url

  const { componentRef: mostRecentComponentRef } = useComponentFromUrl(
    taskSpec.componentRef.url,
  );

  const isOutdated =
    taskSpec.componentRef.digest !== mostRecentComponentRef.digest;

  const dimensions = useTaskNodeDimensions(taskSpec);

  const handleSetArguments = useCallback(
    (args: Record<string, ArgumentType>) => {
      data.callbacks.setArguments(args);
    },
    [data.callbacks],
  );

  const handleSetAnnotations = useCallback(
    (annotations: Annotations) => {
      data.callbacks.setAnnotations(annotations);
    },
    [data.callbacks],
  );

  const handleDeleteTaskNode = useCallback(() => {
    data.callbacks.onDelete();
  }, [data.callbacks]);

  const handleDuplicateTaskNode = useCallback(() => {
    data.callbacks.onDuplicate();
  }, [data.callbacks]);

  const handleUpgradeTaskNode = useCallback(() => {
    if (!isOutdated) {
      notify("Component version already matches source URL", "info");
      return;
    }

    data.callbacks.onUpgrade(mostRecentComponentRef);
  }, [data.callbacks, isOutdated, mostRecentComponentRef, notify]);

  const select = useCallback(() => {
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, selected: true } : node,
      ),
    );
  }, [nodeId, reactFlowInstance]);

  const state = useMemo(
    (): TaskNodeState => ({
      selected: selected && !data.isGhost,
      highlighted: !!data.highlighted && !data.isGhost,
      readOnly: !!data.readOnly || !!data.isGhost,
      connectable: !!data.connectable,
      runStatus: data.isGhost ? undefined : runStatus,
      disabled: data.isGhost ?? false,
      isCustomComponent,
      dimensions,
    }),
    [
      selected,
      data.highlighted,
      data.readOnly,
      data.isGhost,
      runStatus,
      isCustomComponent,
      dimensions,
    ],
  );

  const callbacks = useMemo(
    () => ({
      setArguments: handleSetArguments,
      setAnnotations: handleSetAnnotations,
      onDelete: handleDeleteTaskNode,
      onDuplicate: handleDuplicateTaskNode,
      onUpgrade: handleUpgradeTaskNode,
    }),
    [
      handleSetArguments,
      handleSetAnnotations,
      handleDeleteTaskNode,
      handleDuplicateTaskNode,
      handleUpgradeTaskNode,
    ],
  );

  const value = useMemo(
    () => ({
      taskSpec,
      taskId,
      nodeId,
      inputs,
      outputs,
      name,
      state,
      callbacks,
      select,
    }),
    [taskSpec, taskId, nodeId, inputs, outputs, name, state, callbacks, select],
  );

  return (
    <TaskNodeContext.Provider value={value}>
      {children}
    </TaskNodeContext.Provider>
  );
};

export function useTaskNode() {
  return useRequiredContext(TaskNodeContext);
}
