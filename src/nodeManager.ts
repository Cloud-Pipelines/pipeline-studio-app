import { type Node } from "@xyflow/react";
import { nanoid } from "nanoid";

import {
  type ComponentSpec,
  isGraphImplementation,
} from "./utils/componentSpec";

export type NodeType = "task" | "input" | "output" | "taskInput" | "taskOutput";

interface NodeMapping {
  nodeId: string;
  taskId: string;
  nodeType: NodeType;
  createdAt: number;
}

export class NodeManager {
  private mappings = new Map<string, NodeMapping>();
  private taskToNodeMap = new Map<string, Map<string, string>>();

  private getTaskMapForType(nodeType: NodeType): Map<string, string> {
    if (!this.taskToNodeMap.has(nodeType)) {
      this.taskToNodeMap.set(nodeType, new Map<string, string>());
    }
    return this.taskToNodeMap.get(nodeType)!;
  }

  // Get stable node ID for a task/input/output
  getNodeId(taskId: string, nodeType: NodeType): string {
    const taskMap = this.getTaskMapForType(nodeType);
    const existing = taskMap.get(taskId);

    if (existing) {
      return existing;
    }

    // Generate new stable ID
    const nodeId = `${nodeType}_${nanoid()}`;
    const mapping: NodeMapping = {
      nodeId,
      taskId,
      nodeType,
      createdAt: Date.now(),
    };

    this.mappings.set(nodeId, mapping);
    taskMap.set(taskId, nodeId);

    return nodeId;
  }

  // Update task ID when name changes (keeps same node ID)
  updateTaskId(
    oldTaskId: string,
    newTaskId: string,
    nodeType?: NodeType,
  ): void {
    // If nodeType not provided, search across all types
    if (!nodeType) {
      for (const [type, taskMap] of this.taskToNodeMap) {
        const nodeId = taskMap.get(oldTaskId);
        if (nodeId) {
          this.updateTaskId(oldTaskId, newTaskId, type as NodeType);
          return;
        }
      }
      return;
    }

    const taskMap = this.getTaskMapForType(nodeType);
    const nodeId = taskMap.get(oldTaskId);
    if (!nodeId) return;

    const mapping = this.mappings.get(nodeId);
    if (!mapping) return;

    // Update mappings
    taskMap.delete(oldTaskId);
    taskMap.set(newTaskId, nodeId);

    mapping.taskId = newTaskId;
    this.mappings.set(nodeId, mapping);
  }

  // Remove node when task is deleted
  removeNode(taskId: string, nodeType?: NodeType): void {
    // If nodeType not provided, search across all types
    if (!nodeType) {
      for (const [type, taskMap] of this.taskToNodeMap) {
        if (taskMap.has(taskId)) {
          this.removeNode(taskId, type as NodeType);
          return;
        }
      }
      return;
    }

    const taskMap = this.getTaskMapForType(nodeType);
    const nodeId = taskMap.get(taskId);
    if (!nodeId) return;

    this.mappings.delete(nodeId);
    taskMap.delete(taskId);
  }

  // Get task ID from node ID
  getTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.taskId;
  }

  hasTaskId(taskId: string, nodeType: NodeType): boolean {
    const taskMap = this.getTaskMapForType(nodeType);
    return taskMap.has(taskId);
  }

  // Sync with component spec to handle external changes
  syncWithComponentSpec(componentSpec: ComponentSpec): void {
    const currentTasks = new Map<NodeType, Set<string>>();
    currentTasks.set("task", new Set());
    currentTasks.set("input", new Set());
    currentTasks.set("output", new Set());

    // Collect all current task IDs from spec by type
    if (isGraphImplementation(componentSpec.implementation)) {
      Object.keys(componentSpec.implementation.graph.tasks).forEach(
        (taskId) => {
          currentTasks.get("task")!.add(taskId);
        },
      );
    }

    componentSpec.inputs?.forEach((input) =>
      currentTasks.get("input")!.add(input.name),
    );
    componentSpec.outputs?.forEach((output) =>
      currentTasks.get("output")!.add(output.name),
    );

    // Remove mappings for deleted tasks by type
    for (const [nodeType, taskMap] of this.taskToNodeMap) {
      const currentTasksForType = currentTasks.get(nodeType as NodeType);
      if (!currentTasksForType) continue;

      for (const [taskId] of taskMap) {
        if (!currentTasksForType.has(taskId)) {
          this.removeNode(taskId, nodeType as NodeType);
        }
      }
    }
  }

  // Get all mappings (for debugging/persistence)
  getAllMappings(): NodeMapping[] {
    return Array.from(this.mappings.values());
  }

  getMappingsForType(nodeType: NodeType): NodeMapping[] {
    return Array.from(this.mappings.values()).filter(
      (mapping) => mapping.nodeType === nodeType,
    );
  }

  // Migration method for existing nodes
  migrateExistingNodes(nodes: Node[]): {
    updatedNodes: Node[];
    migrationMap: Record<string, string>;
  } {
    const updatedNodes: Node[] = [];
    const migrationMap: Record<string, string> = {};

    for (const node of nodes) {
      const oldNodeId = node.id;
      let taskId: string;
      let nodeType: NodeType;

      // Extract task ID and node type from legacy node ID
      if (oldNodeId.startsWith("task_")) {
        taskId = oldNodeId.replace(/^task_/, "");
        nodeType = "task";
      } else if (oldNodeId.startsWith("input_")) {
        taskId = oldNodeId.replace(/^input_/, "");
        nodeType = "input";
      } else if (oldNodeId.startsWith("output_")) {
        taskId = oldNodeId.replace(/^output_/, "");
        nodeType = "output";
      } else {
        // Already migrated or unknown format
        updatedNodes.push(node);
        continue;
      }

      // Get or create stable node ID
      const stableNodeId = this.getNodeId(taskId, nodeType);
      migrationMap[oldNodeId] = stableNodeId;

      // Update node with stable ID
      updatedNodes.push({
        ...node,
        id: stableNodeId,
      });
    }

    return { updatedNodes, migrationMap };
  }

  // Batch update for task renames
  batchUpdateTaskIds(
    updates: Array<{
      oldTaskId: string;
      newTaskId: string;
      nodeType: NodeType;
    }>,
  ): void {
    for (const { oldTaskId, newTaskId, nodeType } of updates) {
      this.updateTaskId(oldTaskId, newTaskId, nodeType);
    }
  }

  // Check if a node ID is managed by this NodeManager
  isManaged(nodeId: string): boolean {
    return this.mappings.has(nodeId);
  }

  // Get node type from node ID
  getNodeType(nodeId: string): NodeType | undefined {
    return this.mappings.get(nodeId)?.nodeType;
  }
}
