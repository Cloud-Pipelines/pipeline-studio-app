import { Task } from "../entities/task";
import { promoteInlineSubgraph } from "../entities/taskSubgraphHelper";
import type { Argument, ComponentReference } from "../entities/types";
import type { IdGenerator } from "./idGenerator";

export function createTaskFromComponentRef(
  idGen: IdGenerator,
  incomingRef: ComponentReference,
  taskName: string,
): Task {
  const args: Argument[] = [];

  if (incomingRef.spec?.inputs) {
    for (const input of incomingRef.spec.inputs) {
      args.push({ name: input.name, value: input.default });
    }
  }

  const { componentRef, subgraphSpec } = promoteInlineSubgraph(incomingRef);

  return new Task({
    $id: idGen.next("task"),
    name: taskName,
    componentRef,
    subgraphSpec,
    arguments: args,
  });
}
