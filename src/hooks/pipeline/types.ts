import type { Node, Edge } from "@xyflow/react";

export interface Pipeline {
  nodes: Node[];
  edges: Edge[];
}

export interface PipelineNode extends Node {
  id: string;
  type: "task" | "input";
}
