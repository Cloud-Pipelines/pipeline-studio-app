import {
  type Node,
  type NodeChange,
  useNodesState,
  type XYPosition,
} from "@xyflow/react";
import { useEffect } from "react";

import type { ArgumentType, ComponentSpec, GraphSpec } from "../componentSpec";
import replaceTaskArgumentsInGraphSpec from "../utils/replaceTaskArgumentsInGraphSpec";

type SetComponentSpec = (componentSpec: ComponentSpec) => void;

const useComponentSpecToNodes = (
  componentSpec: ComponentSpec,
  setComponentSpec: SetComponentSpec,
): {
  nodes: Node<any>[];
  onNodesChange: (changes: NodeChange[]) => void;
} => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    getNodes(componentSpec, setComponentSpec),
  );

  useEffect(() => {
    const newNodes = getNodes(componentSpec, setComponentSpec);
    setNodes(newNodes);
  }, [componentSpec]);

  return {
    nodes,
    onNodesChange,
  };
};

const getNodes = (
  componentSpec: ComponentSpec,
  setComponentSpec: SetComponentSpec,
): Node<any>[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = getTaskNodes(graphSpec, componentSpec, setComponentSpec);
  const inputNodes = getInputNodes(componentSpec);
  const outputNodes = getOutputNodes(componentSpec);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const getTaskNodes = (
  graphSpec: GraphSpec,
  componentSpec: ComponentSpec,
  setComponentSpec: SetComponentSpec,
) => {
  return Object.entries(graphSpec.tasks).map<Node<any>>(
    ([taskId, taskSpec]) => {
      const position = extractPositionFromAnnotations(taskSpec.annotations);

      return {
        id: `task_${taskId}`,
        data: {
          taskSpec: taskSpec,
          taskId: taskId,
          setArguments: (args: Record<string, ArgumentType>) => {
            const newGraphSpec = replaceTaskArgumentsInGraphSpec(
              taskId,
              graphSpec,
              args,
            );
            setComponentSpec({
              ...componentSpec,
              implementation: { graph: newGraphSpec },
            });
          },
          duplicateTask: () => {
            const newTaskId = generateDuplicateTaskId(taskId);
            const offset = 10;
            const annotations = taskSpec.annotations || {};
            const updatedAnnotations = setPositionInAnnotations(annotations, {
              x: position.x + offset,
              y: position.y + offset,
            });
            const newTaskSpec = {
              ...taskSpec,
              annotations: { ...updatedAnnotations },
            };
            const newGraphSpec = {
              ...graphSpec,
              tasks: {
                ...graphSpec.tasks,
                [newTaskId]: newTaskSpec,
              },
            };
            setComponentSpec({
              ...componentSpec,
              implementation: { graph: newGraphSpec },
            });
          },
        },
        position: position,
        type: "task",
      };
    },
  );
};

const getInputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.inputs ?? []).map<Node>((inputSpec) => {
    const position = extractPositionFromAnnotations(inputSpec.annotations);

    return {
      id: `input_${inputSpec.name}`,
      data: { label: inputSpec.name },
      position: position,
      type: "input",
    };
  });
};

const getOutputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.outputs ?? []).map<Node>((outputSpec) => {
    const position = extractPositionFromAnnotations(outputSpec.annotations);

    return {
      id: `output_${outputSpec.name}`,
      data: { label: outputSpec.name },
      position: position,
      type: "output",
    };
  });
};

const extractPositionFromAnnotations = (
  annotations?: Record<string, unknown>,
): XYPosition => {
  const defaultPosition: XYPosition = { x: 0, y: 0 };

  if (!annotations) return defaultPosition;

  try {
    const layoutAnnotation = annotations["editor.position"] as string;
    if (!layoutAnnotation) return defaultPosition;

    const decodedPosition = JSON.parse(layoutAnnotation);
    return {
      x: decodedPosition["x"] || 0,
      y: decodedPosition["y"] || 0,
    };
  } catch {
    return defaultPosition;
  }
};

const setPositionInAnnotations = (
  annotations: Record<string, unknown>,
  position: XYPosition,
): Record<string, unknown> => {
  const updatedAnnotations = { ...annotations };
  updatedAnnotations["editor.position"] = JSON.stringify(position);
  return updatedAnnotations;
};

const generateDuplicateTaskId = (taskId: string): string => {
  // If taskId does not end with "_copy", append "_copy"
  // e.g., "task" becomes "task_copy"
  if (!taskId.endsWith("_copy")) {
    return taskId + "_copy";
  }

  // If taskId ends with "_copy", add a number to the end
  // e.g., "task_copy" becomes "task_copy2"
  if (taskId.endsWith("_copy")) {
    return taskId + "2";
  }

  // If taskId ends with "_copyX", increment X
  // e.g., "task_copy2" becomes "task_copy3"
  const match = taskId.match(/^(.*_copy)(\d+)$/);
  if (match) {
    const base = match[1];
    const number = parseInt(match[2], 10);
    return `${base}${number + 1}`;
  }

  // Otherwise, append "_c" - this case should not occur
  return taskId + "_c";
};

export default useComponentSpecToNodes;
