import type { Node } from "@xyflow/react";

import {
  type ComponentSpec,
  type GraphSpec,
  type InputSpec,
  isGraphImplementation,
  type OutputSpec,
  type TaskSpec,
} from "@/utils/componentSpec";

import { isComponentTaskNode } from "./isComponentTaskNode";
import {
  nodeIdToInputName,
  nodeIdToOutputName,
  nodeIdToTaskId,
} from "./nodeIdUtils";

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

  const nodeXPositionComparer = (n1: Node, n2: Node) => {
    const deltaX = n1.position.x - n2.position.x;
    const deltaY = n1.position.y - n2.position.y;
    return deltaX !== 0 ? deltaX : deltaY;
  };
  const nodeYPositionComparer = (n1: Node, n2: Node) => {
    const deltaX = n1.position.x - n2.position.x;
    const deltaY = n1.position.y - n2.position.y;
    return deltaY !== 0 ? deltaY : deltaX;
  };

  const inputNodes = nodes
    .filter((node) => node.type === "input")
    .sort(nodeXPositionComparer);
  const outputNodes = nodes
    .filter((node) => node.type === "output")
    .sort(nodeXPositionComparer);
  const taskNodes = nodes
    .filter(isComponentTaskNode)
    .sort(nodeYPositionComparer);

  const inputPositionMap = new Map<string, string>(
    inputNodes.map((node) => [
      nodeIdToInputName(node.id),
      getNodePositionAnnotation(node),
    ]),
  );
  const inputOrderMap = new Map<string, number>(
    inputNodes.map((node, index) => [nodeIdToInputName(node.id), index]),
  );
  const inputOrderComparer = (a: InputSpec, b: InputSpec) =>
    (inputOrderMap.get(a.name) ?? Infinity) -
    (inputOrderMap.get(b.name) ?? Infinity);

  const outputPositionMap = new Map<string, string>(
    outputNodes.map((node) => [
      nodeIdToOutputName(node.id),
      getNodePositionAnnotation(node),
    ]),
  );
  const outputOrderMap = new Map<string, number>(
    outputNodes.map((node, index) => [nodeIdToOutputName(node.id), index]),
  );
  const outputOrderComparer = (a: OutputSpec, b: OutputSpec) =>
    (outputOrderMap.get(a.name) ?? Infinity) -
    (outputOrderMap.get(b.name) ?? Infinity);

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

  // Input properties
  const newInputs = componentSpec.inputs
    ?.map((inputSpec) => {
      if (
        !inputPositionMap.has(inputSpec.name) ||
        !inputOrderMap.has(inputSpec.name)
      ) {
        throw Error(
          `The nodes array does not have input node ${inputSpec.name}`,
        );
      }

      const newAnnotationsWithPosition = includePositions
        ? {
            [NODE_LAYOUT_ANNOTATION_KEY]: inputPositionMap.get(inputSpec.name),
          }
        : {};

      const newAnnotations = {
        ...inputSpec.annotations,
        ...newAnnotationsWithPosition,
      };

      const newInputSpecAnnotations =
        Object.keys(newAnnotations).length === 0
          ? {}
          : { annotations: newAnnotations };
      const newInputSpec: InputSpec = {
        ...inputSpec,
        ...newInputSpecAnnotations,
      };
      return newInputSpec;
    })
    .sort(inputOrderComparer);

  const newOutputs = componentSpec.outputs
    ?.map((outputSpec) => {
      if (
        !outputPositionMap.has(outputSpec.name) ||
        !outputOrderMap.has(outputSpec.name)
      ) {
        throw Error(
          `The nodes array does not have output node ${outputSpec.name}`,
        );
      }
      const newAnnotationsWithPosition = includePositions
        ? {
            [NODE_LAYOUT_ANNOTATION_KEY]: outputPositionMap.get(
              outputSpec.name,
            ),
          }
        : {};
      const newAnnotations = {
        ...outputSpec.annotations,
        ...newAnnotationsWithPosition,
      };

      const newOutputSpecAnnotations =
        Object.keys(newAnnotations).length === 0
          ? {}
          : { annotations: newAnnotations };
      const newOutputSpec: OutputSpec = {
        ...outputSpec,
        ...newOutputSpecAnnotations,
      };

      return newOutputSpec;
    })
    .sort(outputOrderComparer);

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
    ...(newInputs && { inputs: newInputs }),
    ...(newOutputs && { outputs: newOutputs }),
  };
};
