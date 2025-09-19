import { nanoid } from "nanoid";

import {
  type ComponentSpec,
  isGraphImplementation,
} from "./utils/componentSpec";
import {
  inputNameToInputId,
  outputNameToOutputId,
} from "./utils/nodes/conversions";

export type NodeType =
  | "task"
  | "input"
  | "output"
  | "inputHandle"
  | "outputHandle";

export interface HandleInfo {
  taskId: string;
  handleName: string;
  handleType: NodeType;
}

interface NodeMapping {
  nodeId: string;
  taskId: string;
  nodeType: NodeType;
  createdAt: number;
  // For InputHandle & OutputHandle:
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

  private getHandleMapForTask(taskId: string): Map<string, string> {
    if (!this.taskHandleMap.has(taskId)) {
      this.taskHandleMap.set(taskId, new Map<string, string>());
    }
    return this.taskHandleMap.get(taskId)!;
  }

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

  getHandleNodeId(
    taskId: string,
    handleName: string,
    handleType: "inputHandle" | "outputHandle",
  ): string {
    const taskHandleMap = this.getHandleMapForTask(taskId);
    const handleKey = `${handleType}:${handleName}`;
    const existing = taskHandleMap.get(handleKey);

    if (existing) {
      return existing;
    }

    // Generate new stable ID
    const nodeId = `${handleType}_${nanoid()}`;
    const mapping: NodeMapping = {
      nodeId,
      taskId: handleKey,
      nodeType: handleType,
      createdAt: Date.now(),
      parentTaskId: taskId,
      handleName,
    };

    this.mappings.set(nodeId, mapping);
    taskHandleMap.set(handleKey, nodeId);

    return nodeId;
  }

  updateTaskId(
    oldTaskId: string,
    newTaskId: string,
    nodeType?: NodeType,
  ): void {
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

    taskMap.delete(oldTaskId);
    taskMap.set(newTaskId, nodeId);

    mapping.taskId = newTaskId;
    this.mappings.set(nodeId, mapping);
  }

  private updateTaskHandleMappings(oldTaskId: string, newTaskId: string): void {
    const oldHandleMap = this.taskHandleMap.get(oldTaskId);
    if (!oldHandleMap) return;

    const newHandleMap = new Map(oldHandleMap);
    this.taskHandleMap.set(newTaskId, newHandleMap);
    this.taskHandleMap.delete(oldTaskId);

    for (const nodeId of oldHandleMap.values()) {
      const mapping = this.mappings.get(nodeId);
      if (mapping) {
        mapping.parentTaskId = newTaskId;
        this.mappings.set(nodeId, mapping);
      }
    }
  }

  removeNode(taskId: string, nodeType?: NodeType): void {
    if (!nodeType) {
      for (const [type, taskMap] of this.taskToNodeMap) {
        if (taskMap.has(taskId)) {
          this.removeNode(taskId, type as NodeType);
        }
      }
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

    for (const nodeId of handleMap.values()) {
      this.mappings.delete(nodeId);
    }

    this.taskHandleMap.delete(taskId);
  }

  getTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.taskId;
  }

  getParentTaskId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.parentTaskId;
  }

  getHandleName(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.handleName;
  }

  getHandleInfo(nodeId: string): HandleInfo | undefined {
    const mapping = this.mappings.get(nodeId);
    if (!mapping || !mapping.parentTaskId || !mapping.handleName) {
      return undefined;
    }
    return {
      taskId: mapping.parentTaskId,
      handleName: mapping.handleName,
      handleType: mapping.nodeType,
    };
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

    const currentTaskHandles = new Map<string, Set<string>>();

    // Tasks
    if (isGraphImplementation(componentSpec.implementation)) {
      const graphSpec = componentSpec.implementation.graph;

      Object.keys(graphSpec.tasks).forEach((taskId) => {
        currentTasks.get("task")?.add(taskId);
      });

      Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
        const inputs = taskSpec.componentRef.spec?.inputs || [];
        const outputs = taskSpec.componentRef.spec?.outputs || [];

        if (!currentTaskHandles.has(taskId)) {
          currentTaskHandles.set(taskId, new Set());
        }
        const taskHandleSet = currentTaskHandles.get(taskId)!;

        inputs.forEach((input) => {
          taskHandleSet.add(`inputHandle:${input.name}`);
        });

        outputs.forEach((output) => {
          taskHandleSet.add(`outputHandle:${output.name}`);
        });
      });
    }

    // Graph-level inputs and outputs
    componentSpec.inputs?.forEach((input) => {
      const inputId = inputNameToInputId(input.name);
      currentTasks.get("input")?.add(input.name);

      if (!currentTaskHandles.has(inputId)) {
        currentTaskHandles.set(inputId, new Set());
      }
      currentTaskHandles.get(inputId)?.add("outputHandle:output");
    });

    componentSpec.outputs?.forEach((output) => {
      const outputId = outputNameToOutputId(output.name);
      currentTasks.get("output")?.add(output.name);

      if (!currentTaskHandles.has(outputId)) {
        currentTaskHandles.set(outputId, new Set());
      }
      currentTaskHandles.get(outputId)?.add("inputHandle:input");
    });

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
        this.removeTaskHandles(taskId);
        continue;
      }

      for (const [handleKey, nodeId] of handleMap) {
        if (!currentHandlesForTask.has(handleKey)) {
          this.mappings.delete(nodeId);
          handleMap.delete(handleKey);
        }
      }
    }
  }

  getAllMappings(): NodeMapping[] {
    return Array.from(this.mappings.values());
  }

  getMappingsForType(nodeType: NodeType): NodeMapping[] {
    return Array.from(this.mappings.values()).filter(
      (mapping) => mapping.nodeType === nodeType,
    );
  }

  getNodeType(nodeId: string): NodeType | undefined {
    return this.mappings.get(nodeId)?.nodeType;
  }
}
