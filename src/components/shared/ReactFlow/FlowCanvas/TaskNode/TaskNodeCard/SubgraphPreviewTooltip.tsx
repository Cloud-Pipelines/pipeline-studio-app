import {
  Background,
  type Edge,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BlockStack } from "@/components/ui/layout";
import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
  TaskSpec,
} from "@/utils/componentSpec";
import createNodesFromComponentSpec from "@/utils/nodes/createNodesFromComponentSpec";
import {
  inputNameToNodeId,
  outputNameToNodeId,
  taskIdToNodeId,
} from "@/utils/nodes/nodeIdUtils";

import SmoothEdge from "../../Edges/SmoothEdge";
import IONode from "../../IONode/IONode";
import TaskNode from "../TaskNode";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: TaskNode,
  input: IONode,
  output: IONode,
};

const edgeTypes: Record<string, ComponentType<any>> = {
  customEdge: SmoothEdge,
};

interface SubgraphPreviewTooltipProps {
  children: React.ReactNode;
  subgraphSpec: ComponentSpec | null;
  subgraphName: string;
  enabled?: boolean;
}

// ============================================================================
// Edge Creation Helpers
// ============================================================================

const createEdgesFromSpec = (componentSpec: ComponentSpec): Edge[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskEdges = Object.entries(graphSpec.tasks).flatMap(
    ([taskId, taskSpec]) => createEdgesForTask(taskId, taskSpec),
  );
  const outputEdges = createOutputEdges(graphSpec);
  return [...taskEdges, ...outputEdges];
};

const createEdgesForTask = (taskId: string, taskSpec: TaskSpec): Edge[] => {
  return Object.entries(taskSpec.arguments ?? {}).flatMap(
    ([inputName, argument]) =>
      createEdgeForArgument(taskId, inputName, argument),
  );
};

const createEdgeForArgument = (
  taskId: string,
  inputName: string,
  argument: ArgumentType,
): Edge[] => {
  // Skip if argument is a raw string value
  if (typeof argument === "string") {
    return [];
  }

  if ("taskOutput" in argument) {
    return [createTaskOutputEdge(taskId, inputName, argument)];
  }
  if ("graphInput" in argument) {
    return [createGraphInputEdge(taskId, inputName, argument)];
  }
  return [];
};

const createTaskOutputEdge = (
  taskId: string,
  inputName: string,
  argument: TaskOutputArgument,
): Edge => {
  const sourceTaskId = argument.taskOutput.taskId;
  const sourceOutputName = argument.taskOutput.outputName;
  return {
    id: `${sourceTaskId}_${sourceOutputName}-${taskId}_${inputName}`,
    source: taskIdToNodeId(sourceTaskId),
    sourceHandle: outputNameToNodeId(sourceOutputName),
    target: taskIdToNodeId(taskId),
    targetHandle: inputNameToNodeId(inputName),
    type: "customEdge",
    markerEnd: { type: MarkerType.Arrow },
  };
};

const createGraphInputEdge = (
  taskId: string,
  inputName: string,
  argument: GraphInputArgument,
): Edge => {
  const graphInputName = argument.graphInput.inputName;
  return {
    id: `Input_${graphInputName}-${taskId}_${inputName}`,
    source: inputNameToNodeId(graphInputName),
    sourceHandle: null,
    target: taskIdToNodeId(taskId),
    targetHandle: inputNameToNodeId(inputName),
    type: "customEdge",
    markerEnd: { type: MarkerType.Arrow },
  };
};

const createOutputEdges = (graphSpec: GraphSpec): Edge[] => {
  return Object.entries(graphSpec.outputValues ?? {}).map(
    ([outputName, argument]) => {
      const taskOutput = argument.taskOutput;
      return {
        id: `${taskOutput.taskId}_${taskOutput.outputName}-Output_${outputName}`,
        source: taskIdToNodeId(taskOutput.taskId),
        sourceHandle: outputNameToNodeId(taskOutput.outputName),
        target: outputNameToNodeId(outputName),
        targetHandle: null,
        type: "customEdge",
        markerEnd: { type: MarkerType.Arrow },
      };
    },
  );
};

export const SubgraphPreviewTooltip = ({
  children,
  subgraphSpec,
  subgraphName,
  enabled = true,
}: SubgraphPreviewTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { previewNodes, previewEdges } = useMemo(() => {
    if (!subgraphSpec) {
      return { previewNodes: [], previewEdges: [] };
    }

    const nodes = createNodesFromComponentSpec(subgraphSpec, {
      readOnly: true,
      showBorders: true,
      showIcons: true,
      showStatus: false,
    });
    const edges = createEdgesFromSpec(subgraphSpec);

    return { previewNodes: nodes, previewEdges: edges };
  }, [subgraphSpec, subgraphName]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <HoverCard
      open={isOpen}
      onOpenChange={setIsOpen}
      openDelay={1000}
      closeDelay={100}
    >
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-[500px] h-[400px] p-0 z-50 border-2 border-slate-400 shadow-2xl"
      >
        <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300">
            <p className="text-xs font-semibold text-slate-800">
              {subgraphName}
            </p>
          </div>
          <div className="flex-1 relative bg-white">
            {previewNodes.length > 0 ? (
              <ReactFlowProvider>
                <ReactFlow
                  nodes={previewNodes}
                  edges={previewEdges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.1}
                  maxZoom={1}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  panOnDrag={true}
                  zoomOnScroll={true}
                  zoomOnPinch={true}
                  zoomOnDoubleClick={false}
                  preventScrolling={true}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={10} className="bg-white!" />
                </ReactFlow>
              </ReactFlowProvider>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500 bg-white">
                {subgraphSpec
                  ? "No tasks in this subgraph"
                  : "No preview available"}
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
