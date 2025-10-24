import { nanoid } from "nanoid";

import {
  type ComponentSpec,
  isGraphImplementation,
} from "./utils/componentSpec";

export type NodeType = "task" | "input" | "output" | "handle-in" | "handle-out";

export interface HandleInfo {
  parentRefId: string;
  handleName: string;
  handleType: NodeType;
}

interface NodeMapping {
  refId: string;
  nodeType: NodeType;
  // For InputHandle & OutputHandle:
  parentRefId?: string;
  handleName?: string;
}

/* 
Manages stable ReactFlow Node IDs for Tasks, Inputs and Outputs on the Canvas.
- Each object gets a stable Node ID based on its Reference ID and type.
- Each input/output handle also gets a stable Node ID based on Reference ID and handle name.
- A utility is provided to update Reference IDs to maintain consistency of Node IDs.
- If an object is deleted, its Node ID and all associated handles are removed.
- The NodeManager is automatically kept in sync with all changes in the Component Spec.
*/

export class NodeManager {
  private mappings = new Map<string, NodeMapping>();

  getNodeId(refId: string, nodeType: NodeType): string {
    const existingNodeId = this.findNodeByRefId(refId, nodeType);
    if (existingNodeId) return existingNodeId;

    const nodeId = `${nodeType}_${nanoid()}`;
    this.mappings.set(nodeId, { refId, nodeType });
    return nodeId;
  }

  getHandleNodeId(
    parentRefId: string,
    handleName: string,
    handleType: "handle-in" | "handle-out",
  ): string {
    const handleRefId = `${handleType}:${handleName}`;

    const existingNodeId = this.findHandleByParentAndId(
      parentRefId,
      handleRefId,
    );
    if (existingNodeId) return existingNodeId;

    const nodeId = `${handleType}_${nanoid()}`;
    this.mappings.set(nodeId, {
      refId: handleRefId,
      nodeType: handleType,
      parentRefId,
      handleName,
    });
    return nodeId;
  }

  getHandleInfo(nodeId: string): HandleInfo | undefined {
    const mapping = this.mappings.get(nodeId);
    if (!mapping || !mapping.parentRefId || !mapping.handleName) {
      return undefined;
    }
    return {
      parentRefId: mapping.parentRefId,
      handleName: mapping.handleName,
      handleType: mapping.nodeType,
    };
  }

  getNodeType(nodeId: string): NodeType | undefined {
    return this.mappings.get(nodeId)?.nodeType;
  }

  getRefId(nodeId: string): string | undefined {
    return this.mappings.get(nodeId)?.refId;
  }

  updateRefId(oldRefId: string, newRefId: string, nodeType?: NodeType): void {
    for (const [_, mapping] of this.mappings) {
      if (
        mapping.refId === oldRefId &&
        (!nodeType || mapping.nodeType === nodeType) &&
        !mapping.parentRefId
      ) {
        mapping.refId = newRefId;
      }

      if (mapping.parentRefId === oldRefId) {
        mapping.parentRefId = newRefId;
      }
    }
  }

  // Helpers
  private findNodeByRefId(
    refId: string,
    nodeType: NodeType,
  ): string | undefined {
    for (const [nodeId, mapping] of this.mappings) {
      if (
        mapping.refId === refId &&
        mapping.nodeType === nodeType &&
        !mapping.parentRefId
      ) {
        return nodeId;
      }
    }
    return undefined;
  }

  private findHandleByParentAndId(
    parentRefId: string,
    handleRefId: string,
  ): string | undefined {
    for (const [nodeId, mapping] of this.mappings) {
      if (
        mapping.parentRefId === parentRefId &&
        mapping.refId === handleRefId
      ) {
        return nodeId;
      }
    }
    return undefined;
  }

  // Sync with component spec
  syncWithComponentSpec(componentSpec: ComponentSpec): void {
    const validNodeIds = new Set<string>();

    if (isGraphImplementation(componentSpec.implementation)) {
      const graphSpec = componentSpec.implementation.graph;

      // Tasks
      Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
        const taskNodeId = this.getNodeId(taskId, "task");
        validNodeIds.add(taskNodeId);

        const inputs = taskSpec.componentRef.spec?.inputs || [];
        const outputs = taskSpec.componentRef.spec?.outputs || [];

        inputs.forEach((input) => {
          const handleNodeId = this.getHandleNodeId(
            taskId,
            input.name,
            "handle-in",
          );
          validNodeIds.add(handleNodeId);
        });

        outputs.forEach((output) => {
          const handleNodeId = this.getHandleNodeId(
            taskId,
            output.name,
            "handle-out",
          );
          validNodeIds.add(handleNodeId);
        });
      });
    }

    // IO nodes
    componentSpec.inputs?.forEach((input) => {
      const inputNodeId = this.getNodeId(input.name, "input");
      const handleNodeId = this.getHandleNodeId(
        input.name,
        input.name,
        "handle-out",
      );
      validNodeIds.add(inputNodeId);
      validNodeIds.add(handleNodeId);
    });

    componentSpec.outputs?.forEach((output) => {
      const outputNodeId = this.getNodeId(output.name, "output");
      const handleNodeId = this.getHandleNodeId(
        output.name,
        output.name,
        "handle-in",
      );
      validNodeIds.add(outputNodeId);
      validNodeIds.add(handleNodeId);
    });

    // Remove deleted objects
    for (const nodeId of this.mappings.keys()) {
      if (!validNodeIds.has(nodeId)) {
        this.mappings.delete(nodeId);
      }
    }
  }
}
