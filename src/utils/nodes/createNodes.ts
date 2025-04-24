import { type Node } from "@xyflow/react";

import type { TaskNodeCallbacks } from "@/types/taskNode";
import type { ComponentSpec, GraphSpec } from "@/utils/componentSpec";
import { extractPositionFromAnnotations } from "@/utils/nodes/extractPositionFromAnnotations";

import { taskIdToNodeId } from "./nodeIdUtils";

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

// Dynamic Node Callback types - every callback has the node & task id added to it as an input parameter
type CallbackWithIds<K extends keyof TaskNodeCallbacks> =
  TaskNodeCallbacks[K] extends (...args: infer A) => infer R
    ? (ids: NodeAndTaskId, ...args: A) => R
    : never;

type NodeCallbacks = {
  [K in keyof TaskNodeCallbacks]: CallbackWithIds<K>;
};

type ExcludeNodeAndTaskId<T> = T extends [NodeAndTaskId, ...infer Rest]
  ? Rest
  : never;

export const createNodes = (
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
    const selected = (taskSpec.annotations?.selected as boolean) ?? false;
    const nodeId = taskIdToNodeId(taskId);

    // Inject the taskId and nodeId into the callbacks
    const dynamicCallbacks = generateDynamicCallbacks(
      nodeCallbacks,
      taskId,
      nodeId,
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
      selected: selected,
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

// Utility function
const generateDynamicCallbacks = (
  nodeCallbacks: NodeCallbacks,
  taskId: string,
  nodeId: string,
): NodeCallbacks => {
  return Object.fromEntries(
    (Object.keys(nodeCallbacks) as (keyof NodeCallbacks)[]).map(
      (callbackName) => {
        const callbackFn = nodeCallbacks[callbackName] as CallbackWithIds<
          typeof callbackName
        >;
        return [
          callbackName,
          ((...args: any[]) =>
            callbackFn(
              { taskId, nodeId },
              ...((args ?? []) as ExcludeNodeAndTaskId<
                Parameters<typeof callbackFn>
              >),
            )) as NodeCallbacks[typeof callbackName],
        ];
      },
    ),
  ) as NodeCallbacks;
};

export default createNodes;
