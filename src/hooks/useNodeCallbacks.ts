import { type Node, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

import { getDeleteConfirmationDetails } from "@/components/shared/ReactFlow/FlowCanvas/ConfirmationDialogs/DeleteConfirmation";
import { getUpgradeConfirmationDetails } from "@/components/shared/ReactFlow/FlowCanvas/ConfirmationDialogs/UpgradeComponent";
import type { NodesAndEdges } from "@/components/shared/ReactFlow/FlowCanvas/types";
import { duplicateNodes } from "@/components/shared/ReactFlow/FlowCanvas/utils/duplicateNodes";
import replaceTaskAnnotationsInGraphSpec from "@/components/shared/ReactFlow/FlowCanvas/utils/replaceTaskAnnotationsInGraphSpec";
import replaceTaskArgumentsInGraphSpec from "@/components/shared/ReactFlow/FlowCanvas/utils/replaceTaskArgumentsInGraphSpec";
import { replaceTaskNode } from "@/components/shared/ReactFlow/FlowCanvas/utils/replaceTaskNode";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { Annotations } from "@/types/annotations";
import type { NodeAndTaskId } from "@/types/nodes";
import type { ComponentReference, TaskSpec } from "@/utils/componentSpec";
import type { ArgumentType } from "@/utils/componentSpec";

import type { TriggerDialogProps } from "./useConfirmationDialog";
import useToastNotification from "./useToastNotification";

interface UseNodeCallbacksProps {
  triggerConfirmation: (data: TriggerDialogProps) => Promise<boolean>;
  onElementsRemove: (params: NodesAndEdges) => void;
  updateOrAddNodes: (params: {
    updatedNodes?: Node[];
    newNodes?: Node[];
  }) => void;
}

export const useNodeCallbacks = ({
  triggerConfirmation,
  onElementsRemove,
  updateOrAddNodes,
}: UseNodeCallbacksProps) => {
  const notify = useToastNotification();
  const reactFlowInstance = useReactFlow();

  const {
    graphSpec,
    updateGraphSpec,
    componentSpec,
    setComponentSpec,
    nodeManager,
  } = useComponentSpec();

  // Workaround for nodes state being stale in task node callbacks
  const getNodeById = useCallback(
    (id: string) => {
      if (!reactFlowInstance) {
        console.warn("React Flow instance is not available.");
        return undefined;
      }

      const { getNodes } = reactFlowInstance;
      const nodes = getNodes();
      if (!nodes) {
        console.warn("No nodes found in the current React Flow instance.");
        return undefined;
      }

      const node = nodes.find((n) => n.id === id);
      if (!node) {
        console.warn(`Node with id ${id} not found.`);
        return undefined;
      }
      return node;
    },
    [reactFlowInstance],
  );

  const onDelete = useCallback(
    async (ids: NodeAndTaskId) => {
      const nodeId = ids.nodeId;

      const nodeToDelete = getNodeById(nodeId);

      if (!nodeToDelete) {
        console.warn(`Node with id ${nodeId} not found.`);
        return;
      }

      if (!reactFlowInstance) {
        console.warn("React Flow instance is not available.");
        return;
      }

      const currentEdges = reactFlowInstance.getEdges();

      const edgesToRemove = currentEdges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      );

      const params = {
        nodes: [nodeToDelete],
        edges: edgesToRemove,
      } as NodesAndEdges;

      const confirmed = await triggerConfirmation(
        getDeleteConfirmationDetails(params),
      );

      if (confirmed) {
        onElementsRemove(params);
      }
    },
    [triggerConfirmation, onElementsRemove, getNodeById],
  );

  const setArguments = useCallback(
    (ids: NodeAndTaskId, args: Record<string, ArgumentType>) => {
      const taskId = ids.taskId;
      const newGraphSpec = replaceTaskArgumentsInGraphSpec(
        taskId,
        graphSpec,
        args,
      );
      updateGraphSpec(newGraphSpec);
    },
    [graphSpec, updateGraphSpec],
  );

  const setAnnotations = useCallback(
    (ids: NodeAndTaskId, annotations: Annotations) => {
      const taskId = ids.taskId;
      const newGraphSpec = replaceTaskAnnotationsInGraphSpec(
        taskId,
        graphSpec,
        annotations,
      );
      updateGraphSpec(newGraphSpec);
    },
    [graphSpec, updateGraphSpec],
  );

  const onDuplicate = useCallback(
    (ids: NodeAndTaskId, selected = true) => {
      const nodeId = ids.nodeId;
      const node = getNodeById(nodeId);

      if (!node) {
        console.warn(`Node with id ${nodeId} not found.`);
        return;
      }

      const { updatedComponentSpec, newNodes, updatedNodes } = duplicateNodes(
        componentSpec,
        [node],
        nodeManager,
        { selected },
      );

      setComponentSpec(updatedComponentSpec);

      updateOrAddNodes({
        updatedNodes,
        newNodes,
      });
    },
    [
      componentSpec,
      nodeManager,
      getNodeById,
      setComponentSpec,
      updateOrAddNodes,
    ],
  );

  const onUpgrade = useCallback(
    async (ids: NodeAndTaskId, newComponentRef: ComponentReference) => {
      const nodeId = ids.nodeId;
      const node = getNodeById(nodeId);

      if (!node) {
        console.warn(`Node with id ${nodeId} not found.`);
        return;
      }

      const { updatedGraphSpec, lostInputs } = replaceTaskNode(
        node.data.taskId as string,
        newComponentRef,
        graphSpec,
      );

      if (!newComponentRef.digest) {
        console.error("Component reference does not have a digest.");
        return;
      }

      const dialogData = getUpgradeConfirmationDetails(
        node.data.taskId as string,
        node.data.taskSpec as TaskSpec | undefined,
        newComponentRef.digest,
        lostInputs,
      );

      const confirmed = await triggerConfirmation(dialogData);

      if (confirmed) {
        updateGraphSpec(updatedGraphSpec);
        notify("Component updated", "success");
      }
    },
    [graphSpec, getNodeById, updateGraphSpec, triggerConfirmation, notify],
  );

  return {
    onDelete,
    setArguments,
    setAnnotations,
    onDuplicate,
    onUpgrade,
  };
};
