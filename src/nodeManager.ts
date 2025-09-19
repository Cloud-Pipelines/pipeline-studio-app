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
  // For TaskInput & TaskOutput:
  parentTaskId?: string;
  handleName?: string;
}

/* 
Manages stable node IDs for tasks and their inputs/outputs in the graph.
- Each task gets a stable node ID based on its task ID and type.
- Each task input/output handle also gets a stable node ID based on task ID and handle name.
- If a task is renamed, its node ID remains the same.
- If a task is deleted, its node and all associated handles are removed.
- Input and Output node handles are not managed here, as they are static.
*/

export class NodeManager {
  private mappings = new Map<string, NodeMapping>();
  private taskToNodeMap = new Map<string, Map<string, string>>();
  private taskHandleMap = new Map<string, Map<string, string>>();

  private getTaskMapForType(nodeType: NodeType): Map<string, string> {
    if (!this.taskToNodeMap.has(nodeType)) {
      this.taskToNodeMap.set(nodeType, new Map<string, string>());
    }
    return this.taskToNodeMap.get(nodeType)!;
  }

  private getTaskHandleMapForTask(taskId: string): Map<string, string> {
    if (!this.taskHandleMap.has(taskId)) {
      this.taskHandleMap.set(taskId, new Map<string, string>());
    }
    return this.taskHandleMap.get(taskId)!;
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

  getTaskHandleNodeId(
    taskId: string,
    handleName: string,
    handleType: "taskInput" | "taskOutput",
  ): string {
    const taskHandleMap = this.getTaskHandleMapForTask(taskId);
    const handleKey = `${handleType}:${handleName}`;
    const existing = taskHandleMap.get(handleKey);

    if (existing) {
      return existing;
    }

    // Generate new stable ID
    const nodeId = `${handleType}_${nanoid()}`;
    const mapping: NodeMapping = {
      nodeId,
      taskId: handleKey, // Use handleKey as taskId for lookup
      nodeType: handleType,
      createdAt: Date.now(),
      parentTaskId: taskId,
      handleName,
    };

    this.mappings.set(nodeId, mapping);
    taskHandleMap.set(handleKey, nodeId);

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
      this.updateTaskHandleMappings(oldTaskId, newTaskId);
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

  private updateTaskHandleMappings(oldTaskId: string, newTaskId: string): void {
    const oldHandleMap = this.taskHandleMap.get(oldTaskId);
    if (!oldHandleMap) return;

    // Move all handle mappings to new task ID
    const newHandleMap = new Map(oldHandleMap);
    this.taskHandleMap.set(newTaskId, newHandleMap);
    this.taskHandleMap.delete(oldTaskId);

    // Update all handle node mappings to point to new parent task
    for (const nodeId of oldHandleMap.values()) {
      const mapping = this.mappings.get(nodeId);
      if (mapping) {
        mapping.parentTaskId = newTaskId;
        this.mappings.set(nodeId, mapping);
      }
    }
  }

  // Remove node when task is deleted
  removeNode(taskId: string, nodeType?: NodeType): void {
    // If nodeType not provided, search across all types
    if (!nodeType) {
      for (const [type, taskMap] of this.taskToNodeMap) {
        if (taskMap.has(taskId)) {
          this.removeNode(taskId, type as NodeType);
        }
      }
      // Also remove task handle mappings
      this.removeTaskHandles(taskId);
      return;
    }

    const taskMap = this.getTaskMapForType(nodeType);
    const nodeId = taskMap.get(taskId);
    if (!nodeId) return;

    this.mappings.delete(nodeId);
    taskMap.delete(taskId);
  }

  private removeTaskHandles(taskId: string): void {
    const handleMap = this.taskHandleMap.get(taskId);
    if (!handleMap) return;

    // Remove all handle node mappings
    for (const nodeId of handleMap.values()) {
      this.mappings.delete(nodeId);
    }

    // Remove the task handle map
    this.taskHandleMap.delete(taskId);
  }

  // Get task ID from node ID
  getTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.taskId;
  }

  getParentTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.parentTaskId;
  }

  getHandleName(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.handleName;
  }

  getHandleInfo(
    nodeId: string,
  ): { taskId: string; handleName: string } | undefined {
    const mapping = this.mappings.get(nodeId);
    if (!mapping || !mapping.parentTaskId || !mapping.handleName) {
      return undefined;
    }
    return {
      taskId: mapping.parentTaskId,
      handleName: mapping.handleName,
    };
  }

  hasTaskId(taskId: string, nodeType: NodeType): boolean {
    const taskMap = this.getTaskMapForType(nodeType);
    return taskMap.has(taskId);
  }

  // Sync with component spec to handle external changes
  // Update the NodeManager to sync taskInput/taskOutput with component spec
  syncWithComponentSpec(componentSpec: ComponentSpec): void {
    const currentTasks = new Map<NodeType, Set<string>>();
    currentTasks.set("task", new Set());
    currentTasks.set("input", new Set());
    currentTasks.set("output", new Set());

    const currentTaskHandles = new Map<string, Set<string>>();

    // Collect all current task IDs from spec by type
    if (isGraphImplementation(componentSpec.implementation)) {
      const graphSpec = componentSpec.implementation.graph;

      // Regular tasks
      Object.keys(graphSpec.tasks).forEach((taskId) => {
        currentTasks.get("task")!.add(taskId);
      });

      // Task inputs and outputs from task specs
      Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
        const inputs = taskSpec.componentRef.spec?.inputs || [];
        const outputs = taskSpec.componentRef.spec?.outputs || [];

        if (!currentTaskHandles.has(taskId)) {
          currentTaskHandles.set(taskId, new Set());
        }
        const taskHandleSet = currentTaskHandles.get(taskId)!;

        inputs.forEach((input) => {
          taskHandleSet.add(`taskInput:${input.name}`);
        });

        outputs.forEach((output) => {
          taskHandleSet.add(`taskOutput:${output.name}`);
        });
      });
    }

    // Graph-level inputs and outputs
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

    // Clean up task handles
    for (const [taskId, handleMap] of this.taskHandleMap) {
      const currentHandlesForTask = currentTaskHandles.get(taskId);

      if (!currentHandlesForTask) {
        // Task was deleted, remove all handles
        this.removeTaskHandles(taskId);
        continue;
      }

      // Remove handles that no longer exist
      for (const [handleKey, nodeId] of handleMap) {
        if (!currentHandlesForTask.has(handleKey)) {
          this.mappings.delete(nodeId);
          handleMap.delete(handleKey);
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
