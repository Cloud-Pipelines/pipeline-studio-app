import type { ComponentSpec } from "../entities/componentSpec";
import type { Task } from "../entities/task";
import { locateEntity } from "./locateEntity";

export function findTaskById(
  spec: ComponentSpec,
  entityId: string,
): Task | undefined {
  const location = locateEntity(spec, entityId);
  return location?.kind === "task" ? location.entity : undefined;
}
