import type { Binding } from "../entities/binding";
import type { ComponentSpec } from "../entities/componentSpec";
import type { Input } from "../entities/input";
import type { Output } from "../entities/output";
import type { Task } from "../entities/task";

type LocatedEntity =
  | { kind: "task"; entity: Task }
  | { kind: "input"; entity: Input }
  | { kind: "output"; entity: Output }
  | { kind: "binding"; entity: Binding };

export type LocatedEntityKind = LocatedEntity["kind"];

/**
 * Structurally matches the editor's `ParentContext`, so a location can be
 * handed straight to the I/O actions that propagate port renames and deletes
 * up to the owning subgraph task.
 */
interface EntityParentContext {
  parentSpec: ComponentSpec;
  taskId: string;
}

export type EntityLocation = LocatedEntity & {
  spec: ComponentSpec;
  subgraphTaskNames: string[];
  parentContext?: EntityParentContext;
};

export type EntityLocationOf<K extends LocatedEntityKind> = Extract<
  EntityLocation,
  { kind: K }
>;

export function isLocationOfKind<K extends LocatedEntityKind>(
  location: EntityLocation,
  kind: K,
): location is EntityLocationOf<K> {
  return location.kind === kind;
}

/**
 * Finds which spec in the tree owns `entityId`. `subgraphTaskNames` is the chain
 * of subgraph task names leading to it, so an empty chain means the entity lives
 * in the spec that was passed in, and `parentContext` is absent only in that
 * case. The root is not a segment — deliberately unlike
 * `ComponentValidationIssue.subgraphPath`, which is prefixed with `"root"`;
 * hence the different field name.
 *
 * Entity `$id`s are unique across the whole document (`generateUniqueId`
 * combines a module-level counter with a timestamp), so a match at any depth is
 * unambiguous.
 */
export function locateEntity(
  spec: ComponentSpec,
  entityId: string,
): EntityLocation | undefined {
  const found = findInSpec(spec, entityId);
  if (found) {
    return { ...found, spec, subgraphTaskNames: [] };
  }

  for (const task of spec.tasks) {
    if (!task.subgraphSpec) continue;
    const nested = locateEntity(task.subgraphSpec, entityId);
    if (nested) {
      return {
        ...nested,
        subgraphTaskNames: [task.name, ...nested.subgraphTaskNames],
        parentContext: nested.parentContext ?? {
          parentSpec: spec,
          taskId: task.$id,
        },
      };
    }
  }

  return undefined;
}

export function locatedEntityName(
  location: EntityLocation,
): string | undefined {
  return location.kind === "binding" ? undefined : location.entity.name;
}

function findInSpec(
  spec: ComponentSpec,
  entityId: string,
): LocatedEntity | undefined {
  const task = spec.tasks.find((t) => t.$id === entityId);
  if (task) return { kind: "task", entity: task };

  const input = spec.inputs.find((i) => i.$id === entityId);
  if (input) return { kind: "input", entity: input };

  const output = spec.outputs.find((o) => o.$id === entityId);
  if (output) return { kind: "output", entity: output };

  const binding = spec.bindings.find((b) => b.$id === entityId);
  if (binding) return { kind: "binding", entity: binding };

  return undefined;
}
