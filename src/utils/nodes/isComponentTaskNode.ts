import type { Node } from "@xyflow/react";

export const isComponentTaskNode = (node: Node): node is Node =>
  node.type === "task" &&
  node.data !== undefined &&
  "taskSpec" in node.data &&
  "taskId" in node.data;
