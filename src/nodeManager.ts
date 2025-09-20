import { nanoid } from "nanoid";

import {
  type ComponentSpec,
  isGraphImplementation,
} from "./utils/componentSpec";

export type NodeType = "task" | "input" | "output";

interface NodeMapping {
  nodeId: string;
  taskId: string;
  nodeType: NodeType;
  createdAt: number;
}

export class NodeManager {
  private mappings = new Map<string, NodeMapping>();
  private taskToNodeMap = new Map<string, string>();

  // Get stable node ID for a task/input/output
  getNodeId(taskId: string, nodeType: NodeType): string {
    const existing = this.taskToNodeMap.get(taskId);
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
    this.taskToNodeMap.set(taskId, nodeId);

    return nodeId;
  }

  // Update task ID when name changes (keeps same node ID)
  updateTaskId(oldTaskId: string, newTaskId: string): void {
    const nodeId = this.taskToNodeMap.get(oldTaskId);
    if (!nodeId) return;

    const mapping = this.mappings.get(nodeId);
    if (!mapping) return;

    // Update mappings
    this.taskToNodeMap.delete(oldTaskId);
    this.taskToNodeMap.set(newTaskId, nodeId);

    mapping.taskId = newTaskId;
    this.mappings.set(nodeId, mapping);
  }

  // Remove node when task is deleted
  removeNode(taskId: string): void {
    const nodeId = this.taskToNodeMap.get(taskId);
    if (!nodeId) return;

    this.mappings.delete(nodeId);
    this.taskToNodeMap.delete(taskId);
  }

  // Get task ID from node ID
  getTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.taskId;
  }

  // Sync with component spec to handle external changes
  syncWithComponentSpec(componentSpec: ComponentSpec): void {
    const currentTasks = new Set<string>();

    // Collect all current task IDs from spec
    if (isGraphImplementation(componentSpec.implementation)) {
      Object.keys(componentSpec.implementation.graph.tasks).forEach(
        (taskId) => {
          currentTasks.add(taskId);
        },
      );
    }

    componentSpec.inputs?.forEach((input) => currentTasks.add(input.name));
    componentSpec.outputs?.forEach((output) => currentTasks.add(output.name));

    // Remove mappings for deleted tasks
    for (const [taskId] of this.taskToNodeMap) {
      if (!currentTasks.has(taskId)) {
        this.removeNode(taskId);
      }
    }
  }

  // Get all mappings (for debugging/persistence)
  getAllMappings(): NodeMapping[] {
    return Array.from(this.mappings.values());
  }
}
