import type { TaskNodeCallbacks } from "@/types/taskNode";

import { nodeIdToTaskId } from "./nodeIdUtils";

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

// Dynamic Node Callback types - every callback has the node & task id added to it as an input parameter
type CallbackWithIds<K extends keyof TaskNodeCallbacks> =
  TaskNodeCallbacks[K] extends (...args: infer A) => infer R
    ? (ids: NodeAndTaskId, ...args: A) => R
    : never;

export type NodeCallbacks = {
  [K in keyof TaskNodeCallbacks]: CallbackWithIds<K>;
};

type ExcludeNodeAndTaskId<T> = T extends [NodeAndTaskId, ...infer Rest]
  ? Rest
  : never;

// Utility function
export const generateDynamicNodeCallbacks = (
  nodeCallbacks: NodeCallbacks,
  nodeId: string,
): NodeCallbacks => {
  const taskId = nodeIdToTaskId(nodeId);
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
