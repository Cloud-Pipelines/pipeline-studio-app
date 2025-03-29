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
  removeNode: (nodeId: string) => void,
): {
  nodes: Node<any>[];
  onNodesChange: (changes: NodeChange[]) => void;
} => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    getNodes(componentSpec, setComponentSpec, removeNode),
  );

  useEffect(() => {
    const newNodes = getNodes(componentSpec, setComponentSpec, removeNode);
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
  removeNode: (nodeId: string) => void,
): Node<any>[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = getTaskNodes(
    graphSpec,
    componentSpec,
    setComponentSpec,
    removeNode,
  );
  const inputNodes = getInputNodes(componentSpec);
  const outputNodes = getOutputNodes(componentSpec);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const getTaskNodes = (
  graphSpec: GraphSpec,
  componentSpec: ComponentSpec,
  setComponentSpec: SetComponentSpec,
  removeNode: (nodeId: string) => void,
) => {
  return Object.entries(graphSpec.tasks).map<Node<any>>(
    ([taskId, taskSpec]) => {
      const position = extractPositionFromAnnotations(taskSpec.annotations);
      const nodeId = `task_${taskId}`;

      return {
        id: nodeId,
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
          onDelete: () => {
            removeNode(nodeId);
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

export default useComponentSpecToNodes;
