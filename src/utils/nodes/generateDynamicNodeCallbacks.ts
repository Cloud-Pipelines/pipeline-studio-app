import type {
  CallbackWithIds,
  NodeAndTaskId,
  NodeCallbacks,
} from "@/types/taskNode";

import { nodeIdToTaskId } from "./nodeIdUtils";

type ExcludeNodeAndTaskId<T> = T extends [NodeAndTaskId, ...infer Rest]
  ? Rest
  : never;

// Utility function that adds the taskId and nodeId to the callbacks as the first argument
export const generateDynamicNodeCallbacks = (
  nodeId: string,
  nodeCallbacks?: NodeCallbacks,
): NodeCallbacks => {
  if (!nodeCallbacks) {
    return {} as NodeCallbacks;
  }

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
