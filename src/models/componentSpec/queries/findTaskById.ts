import type { ComponentSpec } from "../entities/componentSpec";
import type { Task } from "../entities/task";

export function findTaskById(
  spec: ComponentSpec,
  entityId: string,
): Task | undefined {
  for (const task of spec.tasks) {
    if (task.$id === entityId) {
      return task;
    }

    const nested =
      task.subgraphSpec && findTaskById(task.subgraphSpec, entityId);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}
