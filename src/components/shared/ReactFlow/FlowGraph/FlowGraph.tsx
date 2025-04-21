/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import type {
  Edge,
  Node,
  NodeChange,
  ReactFlowInstance,
  ReactFlowProps,
} from "@xyflow/react";
import { type OnInit, ReactFlow } from "@xyflow/react";
import type { ComponentType, DragEvent } from "react";
import { useCallback, useState } from "react";

import ConfirmationDialog from "@/components/shared/Dialogs/ConfirmationDialog";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useComponentSpecToNodes, {
  type NodeAndTaskId,
} from "@/hooks/useComponentSpecToNodes";
import { useConnectionHandler } from "@/hooks/useConnectionHandler";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { ArgumentType, TaskOutputArgument } from "@/utils/componentSpec";
import replaceTaskArgumentsInGraphSpec from "@/utils/replaceTaskArgumentsInGraphSpec";

import ComponentTaskNode from "./TaskNode/TaskNode";
import {
  nodeIdToInputName,
  nodeIdToOutputName,
  nodeIdToTaskId,
} from "./utils/nodeIdUtils";
import onDropNode from "./utils/onDropNode";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: ComponentTaskNode,
};

type ConfirmationDialogHandlers = {
  onConfirm: () => void;
  onCancel: () => void;
};

const FlowGraph = ({
  readOnly,
  children,
  ...rest
}: ReactFlowProps & { readOnly?: boolean }) => {
  const { componentSpec, setComponentSpec, graphSpec, updateGraphSpec } =
    useComponentSpec();

  const onDelete = useCallback(async (ids: NodeAndTaskId) => {
    const nodeId = ids.nodeId;
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const confirmed = await triggerConfirmationDialog({
        nodes: [node],
        edges: [],
      });
      if (confirmed) {
        removeNode(node);

        // Ideally the graph spec would be updated from within the Node onDelete fcn itself.
        updateGraphSpec(graphSpec);
      }
    }
  }, []);

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
    [],
  );

  const { nodes, onNodesChange } = useComponentSpecToNodes(componentSpec, {
    onDelete,
    setArguments,
  });

  const { edges, onEdgesChange } = useComponentSpecToEdges(componentSpec);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [nodesToDelete, setNodesToDelete] = useState<Node[] | null>(null);
  const [confirmationDialogHandlers, setConfirmationDialogHandlers] =
    useState<ConfirmationDialogHandlers | null>(null);

  const setTaskArgument = (
    taskId: string,
    inputName: string,
    argument?: ArgumentType,
  ) => {
    if (readOnly) {
      return;
    }

    const oldTaskSpec = graphSpec.tasks[taskId];
    const oldTaskSpecArguments = oldTaskSpec.arguments || {};

    const nonNullArgumentObject = argument ? { [inputName]: argument } : {};
    const newTaskSpecArguments = {
      ...oldTaskSpecArguments,
      ...nonNullArgumentObject,
    };

    const newGraphSpec = replaceTaskArgumentsInGraphSpec(
      taskId,
      graphSpec,
      newTaskSpecArguments,
    );

    updateGraphSpec(newGraphSpec);
  };

  const setGraphOutputValue = (
    outputName: string,
    outputValue?: TaskOutputArgument,
  ) => {
    const nonNullOutputObject = outputValue
      ? { [outputName]: outputValue }
      : {};
    const newGraphOutputValues = {
      ...graphSpec.outputValues,
      ...nonNullOutputObject,
    };
    const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };

    updateGraphSpec(newGraphSpec);
  };

  const addConnection = useConnectionHandler({
    setTaskArgument,
    setGraphOutputValue,
  });

  const removeEdge = (edge: Edge) => {
    const inputName = edge.targetHandle?.replace(/^input_/, "");

    if (inputName !== undefined) {
      setTaskArgument(nodeIdToTaskId(edge.target), inputName);
    } else {
      setGraphOutputValue(nodeIdToOutputName(edge.target));
    }
  };

  const removeComponentInput = (inputNameToRemove: string) => {
    // Removing the outcoming edges
    // Not really needed since react-flow sends the node's incoming and outcoming edges for deletion when a node is deleted
    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
      for (const [inputName, argument] of Object.entries(
        taskSpec.arguments ?? {},
      )) {
        if (typeof argument !== "string" && "graphInput" in argument) {
          if (argument.graphInput.inputName === inputNameToRemove) {
            setTaskArgument(taskId, inputName);
          }
        }
      }
    }

    const newInputs = (componentSpec.inputs ?? []).filter(
      (inputSpec) => inputSpec.name !== inputNameToRemove,
    );
    setComponentSpec({ ...componentSpec, inputs: newInputs });
  };

  const removeComponentOutput = (outputNameToRemove: string) => {
    setGraphOutputValue(outputNameToRemove);
    // Removing the output itself
    const newOutputs = (componentSpec.outputs ?? []).filter(
      (outputSpec) => outputSpec.name !== outputNameToRemove,
    );
    setComponentSpec({ ...componentSpec, outputs: newOutputs });
  };

  const removeTask = (taskIdToRemove: string) => {
    // Step 1: Remove any connections where this task is used as a source
    // (i.e., other tasks that depend on this task's outputs)
    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
      if (!taskSpec.arguments) continue;

      for (const [inputName, argument] of Object.entries(taskSpec.arguments)) {
        // Check if this argument references the task we're removing
        const isReferencingRemovedTask =
          typeof argument !== "string" &&
          "taskOutput" in argument &&
          argument.taskOutput.taskId === taskIdToRemove;

        if (isReferencingRemovedTask) {
          setTaskArgument(taskId, inputName);
        }
      }
    }

    // Step 2: Remove any connections from this task to graph outputs
    const newGraphOutputValues = Object.fromEntries(
      Object.entries(graphSpec.outputValues ?? {}).filter(
        ([_, argument]) => argument.taskOutput.taskId !== taskIdToRemove,
      ),
    );

    // Step 3: Remove the task itself from the graph
    const newTasks = Object.fromEntries(
      Object.entries(graphSpec.tasks).filter(
        ([taskId]) => taskId !== taskIdToRemove,
      ),
    );

    // Step 4: Update the graph spec with our changes
    graphSpec.tasks = newTasks;
    graphSpec.outputValues = newGraphOutputValues;
  };

  const removeNode = (node: Node) => {
    if (node.type === "task") {
      const taskId = nodeIdToTaskId(node.id);
      removeTask(taskId);
    }

    if (node.type === "input") {
      const inputName = nodeIdToInputName(node.id);
      removeComponentInput(inputName);
    }

    if (node.type === "output") {
      const outputName = nodeIdToOutputName(node.id);
      removeComponentOutput(outputName);
    }
  };

  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    if (readOnly) {
      return;
    }

    if (reactFlowInstance) {
      onDropNode(
        event,
        reactFlowInstance,
        componentSpec,
        setComponentSpec,
        graphSpec,
      );
    }
  };

  const triggerConfirmationDialog = async (params: {
    nodes: Node[];
    edges: Edge[];
  }) => {
    setIsConfirmationDialogOpen(true);
    setNodesToDelete(params.nodes);

    return await new Promise<boolean>((resolve) => {
      const handleConfirm = () => {
        setIsConfirmationDialogOpen(false);
        setNodesToDelete(null);
        resolve(true);
      };

      const handleCancel = () => {
        setIsConfirmationDialogOpen(false);
        setNodesToDelete(null);
        resolve(false);
      };

      setConfirmationDialogHandlers({
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      });
    });
  };

  const onElementsRemove = (params: { nodes: Node[]; edges: Edge[] }) => {
    if (readOnly) {
      return;
    }

    for (const edge of params.edges) {
      removeEdge(edge);
    }
    for (const node of params.nodes) {
      removeNode(node);
    }

    // Save the updated graph spec to the component spec
    updateGraphSpec(graphSpec);
  };

  const handleOnNodesChange = (changes: NodeChange[]) => {
    // Process position changes and update component spec
    const positionChanges = changes.filter(
      (change) => change.type === "position" && change.dragging === false,
    );

    if (positionChanges.length > 0) {
      const updatedNodes = positionChanges
        .map((change) => {
          if ("id" in change && "position" in change) {
            const node = nodes.find((n) => n.id === change.id);
            return node
              ? {
                  ...node,
                  position: { x: change?.position?.x, y: change?.position?.y },
                }
              : null;
          }
          return null;
        })
        .filter(Boolean) as Node[];

      if (updatedNodes.length > 0) {
        updateNodePositions(updatedNodes, componentSpec, setComponentSpec);
      }
    }

    onNodesChange(changes);
  };

  const handleBeforeDelete = async (params: {
    nodes: Node[];
    edges: Edge[];
  }) => {
    if (params.nodes.length === 0 && params.edges.length === 0) {
      return false;
    }

    const confirmed = await triggerConfirmationDialog(params);
    return confirmed;
  };

  const isDeletingMultipleNodes = nodesToDelete && nodesToDelete.length > 1;

  const singleDeleteTitle =
    "Delete Node" +
    (nodesToDelete && nodesToDelete.length > 0
      ? ` '${nodesToDelete?.[0].id}'`
      : "") +
    "?";
  const multiDeleteTitle = `Delete Nodes?`;

  const singleDeleteDesc =
    "This will also will also delete all connections to and from the Node. This cannot be undone.";
  const multiDeleteDesc = `Deleting ${
    nodesToDelete
      ? nodesToDelete
          .map((node) => {
            return `'${node.id}'`;
          })
          .join(", ")
      : "nodes"
  } will also delete all connections to and from these nodes. This cannot be undone.`;

  return (
    <>
      <ReactFlow
        {...rest}
        nodes={nodes}
        edges={edges}
        onNodesChange={handleOnNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={addConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onBeforeDelete={handleBeforeDelete}
        onDelete={onElementsRemove}
        onInit={onInit}
        deleteKeyCode={["Delete", "Backspace"]}
      >
        {children}
      </ReactFlow>
      {nodesToDelete && (
        <ConfirmationDialog
          title={isDeletingMultipleNodes ? multiDeleteTitle : singleDeleteTitle}
          description={
            isDeletingMultipleNodes ? multiDeleteDesc : singleDeleteDesc
          }
          isOpen={isConfirmationDialogOpen}
          onConfirm={() => confirmationDialogHandlers?.onConfirm()}
          onCancel={() => confirmationDialogHandlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowGraph;
