import { type Node, type NodeChange, useNodesState } from "@xyflow/react";
import { useEffect } from "react";

import replaceTaskArgumentsInGraphSpec from "@/components/shared/ReactFlow/FlowGraph/utils/replaceTaskArgumentsInGraphSpec";
import type {
  ArgumentType,
  ComponentSpec,
  GraphSpec,
} from "@/utils/componentSpec";
import { extractPositionFromAnnotations } from "@/utils/nodes/extractPositionFromAnnotations";

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

type SetComponentSpec = (componentSpec: ComponentSpec) => void;

const useComponentSpecToNodes = (
  componentSpec: ComponentSpec,
  setComponentSpec: SetComponentSpec,
  removeNode: (nodeId: string) => void,
): {
  nodes: Node[];
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

export default useComponentSpecToNodes;
