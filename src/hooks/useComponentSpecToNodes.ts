import { type Node, type NodeChange, useNodesState } from "@xyflow/react";
import { useEffect } from "react";

import type { ComponentTaskNodeCallbacks } from "@/DragNDrop/ComponentTaskNode";
import { extractPositionFromAnnotations } from "@/utils/extractPositionFromAnnotations";

import type { ComponentSpec, GraphSpec } from "../componentSpec";

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

// Dynamic Node Callback types - every callback has the node & task id added to it as an input parameter
type CallbackArgs = Parameters<
  NonNullable<ComponentTaskNodeCallbacks[keyof ComponentTaskNodeCallbacks]>
>;

type CallbackWithIds<K extends keyof ComponentTaskNodeCallbacks> = (
  ids: NodeAndTaskId,
  ...args: K extends keyof ComponentTaskNodeCallbacks
    ? Parameters<NonNullable<ComponentTaskNodeCallbacks[K]>>
    : never
) => void;

type NodeCallbacks = {
  [K in keyof ComponentTaskNodeCallbacks]: CallbackWithIds<K>;
};

const useComponentSpecToNodes = (
  componentSpec: ComponentSpec,
  nodeCallbacks: NodeCallbacks,
): {
  nodes: Node[];
  onNodesChange: (changes: NodeChange[]) => void;
} => {
  const initialNodes = createNodes(componentSpec, nodeCallbacks);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  useEffect(() => {
    const newNodes = createNodes(componentSpec, nodeCallbacks);
    setNodes(newNodes);
  }, [componentSpec]);

  return {
    nodes,
    onNodesChange,
  };
};

const createNodes = (
  componentSpec: ComponentSpec,
  nodeCallbacks: NodeCallbacks,
): Node[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = createTaskNodes(graphSpec, nodeCallbacks);
  const inputNodes = createInputNodes(componentSpec);
  const outputNodes = createOutputNodes(componentSpec);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const createTaskNodes = (
  graphSpec: GraphSpec,
  nodeCallbacks: NodeCallbacks,
) => {
  return Object.entries(graphSpec.tasks).map(([taskId, taskSpec]) => {
    const position = extractPositionFromAnnotations(taskSpec.annotations);
    const nodeId = `task_${taskId}`;

    // Dynamically add callbacks to node by first injecting the node & task id
    const dynamicCallbacks = Object.fromEntries(
      Object.entries(nodeCallbacks).map(([callbackName, callbackFn]) => [
        callbackName,
        (...args: CallbackArgs) =>
          args.length
            ? callbackFn({ taskId, nodeId }, ...args)
            : callbackFn({ taskId, nodeId }, {}),
      ]),
    );

    return {
      id: nodeId,
      data: {
        taskSpec: taskSpec,
        taskId: taskId,
        ...dynamicCallbacks,
      },
      position: position,
      type: "task",
    } as Node;
  });
};

const createInputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.inputs ?? []).map((inputSpec) => {
    const position = extractPositionFromAnnotations(inputSpec.annotations);

    return {
      id: `input_${inputSpec.name}`,
      data: { label: inputSpec.name },
      position: position,
      type: "input",
    } as Node;
  });
};

const createOutputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.outputs ?? []).map((outputSpec) => {
    const position = extractPositionFromAnnotations(outputSpec.annotations);

    return {
      id: `output_${outputSpec.name}`,
      data: { label: outputSpec.name },
      position: position,
      type: "output",
    } as Node;
  });
};

export default useComponentSpecToNodes;
