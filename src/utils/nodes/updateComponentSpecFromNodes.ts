import type { Node } from "@xyflow/react";

import {
  type ComponentSpec,
  type GraphSpec,
  isGraphImplementation,
  type TaskSpec,
} from "@/utils/componentSpec";

import { isComponentTaskNode } from "./isComponentTaskNode";
import { nodeIdToTaskId } from "./nodeIdUtils";

const NODE_LAYOUT_ANNOTATION_KEY = "editor.position";
const SDK_ANNOTATION_KEY = "sdk";
const SDK_ANNOTATION_VALUE = "https://cloud-pipelines.net/pipeline-editor/";

export const updateComponentSpecFromNodes = (
  componentSpec: ComponentSpec,
  nodes: Node[],
  includeSpecs = false,
  includePositions = true,
): ComponentSpec => {
  const getNodePositionAnnotation = (node: Node) =>
    JSON.stringify({
      x: node.position.x,
      y: node.position.y,
      ...node.measured,
    });

  const nodeYPositionComparer = (n1: Node, n2: Node) => {
    const deltaX = n1.position.x - n2.position.x;
    const deltaY = n1.position.y - n2.position.y;
    return deltaY !== 0 ? deltaY : deltaX;
  };

  const taskNodes = nodes
    .filter(isComponentTaskNode)
    .sort(nodeYPositionComparer);

  const taskPositionMap = new Map<string, string>(
    taskNodes.map((node) => [
      nodeIdToTaskId(node.id),
      getNodePositionAnnotation(node),
    ]),
  );
  const taskOrderMap = new Map<string, number>(
    taskNodes.map((node, index) => [nodeIdToTaskId(node.id), index]),
  );
  const taskOrderComparer = (
    pairA: [string, TaskSpec],
    pairB: [string, TaskSpec],
  ) =>
    (taskOrderMap.get(pairA[0]) ?? Infinity) -
    (taskOrderMap.get(pairB[0]) ?? Infinity);

  if (!isGraphImplementation(componentSpec.implementation)) {
    return componentSpec;
  }

  const graphSpec: GraphSpec = { ...componentSpec.implementation.graph };

  const newTasks = Object.fromEntries(
    Object.entries(graphSpec.tasks || {})
      .map(([taskId, taskSpec]: [string, TaskSpec]) => {
        if (!taskPositionMap.has(taskId) || !taskOrderMap.has(taskId)) {
          throw Error(`The nodes array does not have task node ${taskId}`);
        }
        const newAnnotationsWithPosition = includePositions
          ? {
              [NODE_LAYOUT_ANNOTATION_KEY]: taskPositionMap.get(taskId),
            }
          : {};
        const newAnnotations = {
          ...taskSpec.annotations,
          ...newAnnotationsWithPosition,
        };
        const newTaskSpecAnnotations =
          Object.keys(newAnnotations).length === 0
            ? {}
            : { annotations: newAnnotations };

        const newTaskSpecComponentRef =
          !includeSpecs &&
          taskSpec.componentRef.spec !== undefined &&
          taskSpec.componentRef.url !== undefined
            ? {
                componentRef: Object.fromEntries(
                  Object.entries(taskSpec.componentRef).filter(
                    ([key]) => key !== "spec",
                  ),
                ),
              }
            : {};

        const newTaskSpec: TaskSpec = {
          ...taskSpec,
          ...newTaskSpecAnnotations,
          ...newTaskSpecComponentRef,
        };

        return [taskId, newTaskSpec] as [string, TaskSpec];
      })
      .sort(taskOrderComparer),
  );

  if (newTasks !== undefined) {
    graphSpec.tasks = newTasks;
  }
  const newGraphSpecTask = newTasks ? newTasks : {};
  const newGraphSpec = { ...graphSpec, tasks: newGraphSpecTask };

  const newComponentSpec: ComponentSpec = {
    ...componentSpec,
    implementation: {
      ...componentSpec.implementation,
      graph: newGraphSpec,
    },
    metadata: {
      ...componentSpec.metadata,
      annotations: {
        ...componentSpec.metadata?.annotations,
        [SDK_ANNOTATION_KEY]: SDK_ANNOTATION_VALUE,
      },
    },
  };

  return {
    ...newComponentSpec,
  };
};
