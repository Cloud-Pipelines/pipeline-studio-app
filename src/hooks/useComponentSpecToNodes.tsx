import type { Node, XYPosition } from "@xyflow/react";

import type { ArgumentType, ComponentSpec, GraphSpec } from "../componentSpec";
import getNewGraphSpec from "../utils/getNewGraphSpec";

type SetComponentSpec = (componentSpec: ComponentSpec) => void;

const useComponentSpecToNodes = (
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
            const newGraphSpec = getNewGraphSpec(taskId, graphSpec, args);
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
  } catch (err) {
    return defaultPosition;
  }
};

export default useComponentSpecToNodes;
