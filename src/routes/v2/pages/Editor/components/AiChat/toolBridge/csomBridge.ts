/**
 * CSOM bridge handlers — the spec-mutation slice of `ToolBridgeApi`.
 *
 * Each handler resolves which spec in the tree owns the `$id` it was given
 * (`mutationTarget.ts`) and mutates that spec inside `deps.undo.withGroup(...)`,
 * so an edit lands in the subgraph the entity actually lives in. The undo
 * manager and autosave are both anchored at the root spec and traverse the whole
 * document, so nested edits are undoable and persisted without extra wiring.
 * Mirrors the worker-side `csomTools.ts` tool surface one-to-one.
 */
import type {
  ConnectArgs,
  ToolBridgeApi,
  ValidationResult,
} from "@/agent/toolBridgeApi";
import type { EntityLocationOf } from "@/models/componentSpec/queries/locateEntity";
import { collectValidationIssues } from "@/models/componentSpec/validation/collectIssues";
import {
  connectNodes,
  deleteSelectedEdgesByEdgeIds,
} from "@/routes/v2/pages/Editor/store/actions/connection.actions";
import {
  addInput,
  addOutput,
  deleteInput,
  deleteOutput,
  renameInput,
  renameOutput,
  setInputDefaultValue,
  setInputDescription,
  setInputType,
  setOutputDescription,
} from "@/routes/v2/pages/Editor/store/actions/io.actions";
import {
  createSubgraph,
  renamePipeline,
  updatePipelineDescription,
} from "@/routes/v2/pages/Editor/store/actions/pipeline.actions";
import {
  addTask,
  deleteTask,
  renameTask,
  unpackSubgraphTask,
} from "@/routes/v2/pages/Editor/store/actions/task.actions";
import { serializeSpecForAi } from "@/routes/v2/shared/components/AiChat/serializeSpecForAi";
import type { BridgeDeps } from "@/routes/v2/shared/components/AiChat/toolBridge/utils";
import {
  computeNextPosition,
  requireSpec,
} from "@/routes/v2/shared/components/AiChat/toolBridge/utils";
import type { UndoGroupable } from "@/routes/v2/shared/nodes/types";
import { hydrateComponentReference } from "@/services/componentService";

import {
  applyToTarget,
  describeEntityLocation,
  resolveConnectable,
  resolveTarget,
} from "./mutationTarget";

/**
 * CSOM handlers need the Editor's undo store to make the agent's spec
 * edits user-visible and undoable as a single step. `undo` lives here
 * (not in the shared `BridgeDeps`) because only the Editor's mutating
 * bridge depends on it.
 */
export type CsomBridgeDeps = BridgeDeps & { undo: UndoGroupable };

type CsomHandlers = Pick<
  ToolBridgeApi,
  | "getPipelineState"
  | "setPipelineName"
  | "setPipelineDescription"
  | "addTask"
  | "deleteTask"
  | "renameTask"
  | "addInput"
  | "deleteInput"
  | "renameInput"
  | "addOutput"
  | "deleteOutput"
  | "renameOutput"
  | "connectNodes"
  | "deleteEdge"
  | "setTaskArgument"
  | "createSubgraph"
  | "unpackSubgraph"
  | "validatePipeline"
>;

export function createCsomBridgeHandlers(deps: CsomBridgeDeps): CsomHandlers {
  return {
    async getPipelineState() {
      return serializeSpecForAi(requireSpec(deps), {
        activeSubgraphPath: deps.getActiveSubgraphPath(),
      });
    },

    async setPipelineName(name) {
      const spec = requireSpec(deps);
      renamePipeline(deps.undo, spec, name);
      return { success: true };
    },

    async setPipelineDescription(description) {
      const spec = requireSpec(deps);
      updatePipelineDescription(deps.undo, spec, description);
      return { success: true };
    },

    async addTask({ name, componentRef }) {
      const spec = requireSpec(deps);
      const hydrated =
        (await hydrateComponentReference(componentRef)) ?? componentRef;
      const task = addTask(
        deps.undo,
        spec,
        hydrated,
        computeNextPosition(spec),
      );
      if (!task) {
        return { success: false, error: "addTask returned no task" };
      }
      if (name && task.name !== name) {
        renameTask(deps.undo, spec, task.$id, name);
      }
      return { success: true, taskId: task.$id, name: task.name };
    },

    async deleteTask(entityId) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "task", (location) =>
        deleteTask(deps.undo, location.spec, entityId),
      );
    },

    async renameTask(entityId, newName) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "task", (location) =>
        renameTask(deps.undo, location.spec, entityId, newName),
      );
    },

    async addInput({ name, type, description, defaultValue, optional }) {
      const spec = requireSpec(deps);
      const input = addInput(deps.undo, spec, computeNextPosition(spec), name);
      if (type) setInputType(deps.undo, spec, input.$id, type);
      if (description)
        setInputDescription(deps.undo, spec, input.$id, description);
      if (defaultValue)
        setInputDefaultValue(deps.undo, spec, input.$id, defaultValue);
      if (optional !== undefined) {
        deps.undo.withGroup("Set input optional", () => {
          input.setOptional(optional);
        });
      }
      return { success: true, inputId: input.$id, name: input.name };
    },

    async deleteInput(entityId) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "input", (location) =>
        deleteInput(deps.undo, location.spec, entityId, location.parentContext),
      );
    },

    async renameInput(entityId, newName) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "input", (location) =>
        renameInput(
          deps.undo,
          location.spec,
          entityId,
          newName,
          location.parentContext,
        ),
      );
    },

    async addOutput({ name, type, description }) {
      const spec = requireSpec(deps);
      const output = addOutput(
        deps.undo,
        spec,
        computeNextPosition(spec),
        name,
      );
      if (type) {
        deps.undo.withGroup("Set output type", () => output.setType(type));
      }
      if (description)
        setOutputDescription(deps.undo, spec, output.$id, description);
      return { success: true, outputId: output.$id, name: output.name };
    },

    async deleteOutput(entityId) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "output", (location) =>
        deleteOutput(
          deps.undo,
          location.spec,
          entityId,
          location.parentContext,
        ),
      );
    },

    async renameOutput(entityId, newName) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "output", (location) =>
        renameOutput(
          deps.undo,
          location.spec,
          entityId,
          newName,
          location.parentContext,
        ),
      );
    },

    async connectNodes(args: ConnectArgs) {
      const root = requireSpec(deps);

      const source = resolveConnectable(root, args.sourceEntityId);
      if (!source.ok) return { success: false, error: source.error };
      const target = resolveConnectable(root, args.targetEntityId);
      if (!target.ok) return { success: false, error: target.error };

      if (source.location.spec !== target.location.spec) {
        return {
          success: false,
          error: `Cannot connect ${describeEntityLocation(source.location, args.sourceEntityId)} to ${describeEntityLocation(target.location, args.targetEntityId)} — a connection cannot cross a subgraph boundary. Route the value through the subgraph's own inputs and outputs instead.`,
        };
      }

      const spec = source.location.spec;
      const ok = connectNodes(deps.undo, spec, {
        sourceNodeId: args.sourceEntityId,
        sourceHandleId: `output_${args.sourcePortName}`,
        targetNodeId: args.targetEntityId,
        targetHandleId: `input_${args.targetPortName}`,
      });
      if (!ok) {
        return {
          success: false,
          error:
            "Could not create binding — invalid source/target combination.",
        };
      }
      const binding = spec.bindings.find(
        (b) =>
          b.sourceEntityId === args.sourceEntityId &&
          b.sourcePortName === args.sourcePortName &&
          b.targetEntityId === args.targetEntityId &&
          b.targetPortName === args.targetPortName,
      );
      if (!binding) {
        return {
          success: true,
          error: "Connection created but binding id could not be resolved.",
        };
      }
      return { success: true, bindingId: binding.$id };
    },

    async deleteEdge(entityId) {
      const root = requireSpec(deps);
      return applyToTarget(root, entityId, "binding", (location) => {
        deleteSelectedEdgesByEdgeIds(deps.undo, location.spec, [
          `edge_${entityId}`,
        ]);
        return !location.spec.bindings.some((b) => b.$id === entityId);
      });
    },

    async setTaskArgument(taskEntityId, inputName, value) {
      const target = resolveTarget(requireSpec(deps), taskEntityId, "task");
      if (!target.ok) {
        return { success: false, error: target.error };
      }
      const { location } = target;

      const hasInput = location.entity.resolvedComponentSpec?.inputs?.some(
        (i) => i.name === inputName,
      );
      if (!hasInput) {
        return {
          success: false,
          error: `Task "${location.entity.name}" has no input named "${inputName}"`,
        };
      }
      deps.undo.withGroup("Set task argument", () => {
        location.spec.setTaskArgument(taskEntityId, inputName, value);
      });
      return { success: true };
    },

    async createSubgraph(taskEntityIds, subgraphName) {
      const root = requireSpec(deps);

      const locations: Array<{
        id: string;
        location: EntityLocationOf<"task">;
      }> = [];
      for (const taskEntityId of taskEntityIds) {
        const target = resolveTarget(root, taskEntityId, "task");
        if (!target.ok) {
          return { success: false, error: target.error };
        }
        locations.push({ id: taskEntityId, location: target.location });
      }

      const first = locations[0];
      if (!first) {
        return {
          success: false,
          error:
            "Could not create subgraph — pass the $ids of at least two tasks to group.",
        };
      }
      const stray = locations.find(
        (l) => l.location.spec !== first.location.spec,
      );
      if (stray) {
        return {
          success: false,
          error: `Cannot group ${describeEntityLocation(first.location, first.id)} with ${describeEntityLocation(stray.location, stray.id)} — every task in a new subgraph must already live in the same pipeline or subgraph.`,
        };
      }

      const spec = first.location.spec;
      const subgraphTask = createSubgraph(
        deps.undo,
        spec,
        taskEntityIds,
        subgraphName,
        computeNextPosition(spec),
      );
      if (!subgraphTask) {
        return {
          success: false,
          error:
            "Could not create subgraph — pass the $ids of at least two tasks that can be grouped together.",
        };
      }
      return { success: true, subgraphTaskId: subgraphTask.$id };
    },

    async unpackSubgraph(taskEntityId) {
      const root = requireSpec(deps);
      return applyToTarget(root, taskEntityId, "task", (location) =>
        unpackSubgraphTask(deps.undo, location.spec, taskEntityId),
      );
    },

    async validatePipeline(): Promise<ValidationResult> {
      const issues = collectValidationIssues(requireSpec(deps));
      return {
        valid: issues.length === 0,
        issueCount: issues.length,
        issues: issues.map((i) => ({
          type: i.type,
          severity: i.severity,
          message: i.message,
          entityId: i.entityId,
          entityName: i.entityName,
          issueCode: i.issueCode,
          subgraphPath: i.subgraphPath,
        })),
      };
    },
  };
}
