/**
 * The one place that decides whether a binding's endpoints are legal, shared by
 * validation and by the AI tool bridge so the agent is refused on exactly the
 * grounds the validator would later report.
 *
 * Port names are only checked on task endpoints. For graph inputs and outputs
 * the serializer reads the entity's own name and ignores the binding's port
 * name, so a rename leaves that field stale by design rather than broken.
 */
import { IS_ENABLED_PORT_NAME } from "@/utils/conditionalExecution";

import type { ComponentSpec } from "../entities/componentSpec";

export type BindingEndpointProblem =
  | { kind: "source-is-graph-output"; entityName: string }
  | { kind: "target-is-graph-input"; entityName: string }
  | {
      kind: "unknown-task-output";
      entityName: string;
      portName: string;
      availablePorts: string[];
    }
  | {
      kind: "unknown-task-input";
      entityName: string;
      portName: string;
      availablePorts: string[];
    };

export interface BindingEndpoints {
  sourceEntityId: string;
  sourcePortName: string;
  targetEntityId: string;
  targetPortName: string;
}

export function findBindingEndpointProblems(
  spec: ComponentSpec,
  endpoints: BindingEndpoints,
): BindingEndpointProblem[] {
  const problems: BindingEndpointProblem[] = [];

  const sourceOutput = spec.outputs.find(
    (o) => o.$id === endpoints.sourceEntityId,
  );
  if (sourceOutput) {
    problems.push({
      kind: "source-is-graph-output",
      entityName: sourceOutput.name,
    });
  }

  const targetInput = spec.inputs.find(
    (i) => i.$id === endpoints.targetEntityId,
  );
  if (targetInput) {
    problems.push({
      kind: "target-is-graph-input",
      entityName: targetInput.name,
    });
  }

  const sourceTask = spec.tasks.find((t) => t.$id === endpoints.sourceEntityId);
  const sourcePorts = sourceTask?.resolvedComponentSpec?.outputs;
  if (
    sourceTask &&
    sourcePorts &&
    !sourcePorts.some((o) => o.name === endpoints.sourcePortName)
  ) {
    problems.push({
      kind: "unknown-task-output",
      entityName: sourceTask.name,
      portName: endpoints.sourcePortName,
      availablePorts: sourcePorts.map((o) => o.name),
    });
  }

  const targetTask = spec.tasks.find((t) => t.$id === endpoints.targetEntityId);
  const targetPorts = targetTask?.resolvedComponentSpec?.inputs;
  if (
    targetTask &&
    targetPorts &&
    endpoints.targetPortName !== IS_ENABLED_PORT_NAME &&
    !targetPorts.some((i) => i.name === endpoints.targetPortName)
  ) {
    problems.push({
      kind: "unknown-task-input",
      entityName: targetTask.name,
      portName: endpoints.targetPortName,
      availablePorts: targetPorts.map((i) => i.name),
    });
  }

  return problems;
}

export function describeBindingEndpointProblem(
  problem: BindingEndpointProblem,
): string {
  switch (problem.kind) {
    case "source-is-graph-output":
      return `Pipeline output "${problem.entityName}" cannot be the source of a connection — outputs only receive values.`;
    case "target-is-graph-input":
      return `Pipeline input "${problem.entityName}" cannot be the target of a connection — inputs only supply values.`;
    case "unknown-task-output":
      return `Task "${problem.entityName}" has no output named "${problem.portName}"${formatAvailable(problem.availablePorts)}`;
    case "unknown-task-input":
      return `Task "${problem.entityName}" has no input named "${problem.portName}"${formatAvailable(problem.availablePorts)}`;
  }
}

function formatAvailable(ports: string[]): string {
  if (ports.length === 0) return ".";
  return `. Available: ${ports.map((p) => `"${p}"`).join(", ")}.`;
}
