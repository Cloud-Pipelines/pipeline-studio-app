import { describe, expect, it } from "vitest";

import type { ComponentSpec } from "@/models/componentSpec";
import { Binding } from "@/models/componentSpec/entities/binding";
import { IncrementingIdGenerator } from "@/models/componentSpec/factories/idGenerator";
import type { EntityLocationOf } from "@/models/componentSpec/queries/locateEntity";
import { locateEntity } from "@/models/componentSpec/queries/locateEntity";
import { YamlDeserializer } from "@/models/componentSpec/serialization/yamlDeserializer";

import {
  applyToTarget,
  describeEntityLocation,
  explainNameCollision,
  explainNotASubgraph,
  resolveArgumentValue,
  resolveConnectable,
  resolveTarget,
} from "./mutationTarget";

const container = (name: string, inputs: string[], outputs: string[]) => ({
  name,
  spec: {
    name,
    inputs: inputs.map((n) => ({ name: n, type: "String" })),
    outputs: outputs.map((n) => ({ name: n, type: "String" })),
    implementation: { container: { image: `${name.toLowerCase()}:1` } },
  },
});

const pipelineYaml = {
  name: "RootPipeline",
  inputs: [{ name: "raw_path", type: "String" }],
  outputs: [{ name: "model", type: "String" }],
  implementation: {
    graph: {
      tasks: {
        Train: { componentRef: container("Train", ["path"], ["model"]) },
        Preprocess: {
          componentRef: {
            name: "Preprocess",
            spec: {
              name: "Preprocess",
              inputs: [{ name: "path", type: "String" }],
              outputs: [{ name: "table", type: "String" }],
              implementation: {
                graph: {
                  tasks: {
                    DropNulls: {
                      componentRef: container("DropNulls", ["path"], ["table"]),
                    },
                    Normalize: {
                      componentRef: container(
                        "Normalize",
                        ["table"],
                        ["table"],
                      ),
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function deserialize(): ComponentSpec {
  return new YamlDeserializer(new IncrementingIdGenerator()).deserialize(
    pipelineYaml,
  );
}

function subgraphOf(spec: ComponentSpec, taskName: string): ComponentSpec {
  const task = spec.tasks.find((t) => t.name === taskName);
  if (!task?.subgraphSpec) throw new Error(`${taskName} is not a subgraph`);
  return task.subgraphSpec;
}

function idOf(spec: ComponentSpec, taskName: string): string {
  const task = spec.tasks.find((t) => t.name === taskName);
  if (!task) throw new Error(`no task ${taskName}`);
  return task.$id;
}

function taskLocation(
  root: ComponentSpec,
  entityId: string,
): EntityLocationOf<"task"> {
  const resolved = resolveTarget(root, entityId, "task");
  if (!resolved.ok) throw new Error(resolved.error);
  return resolved.location;
}

describe("describeEntityLocation", () => {
  it("names the top-level pipeline for a root entity", () => {
    const spec = deserialize();
    const id = idOf(spec, "Train");

    expect(describeEntityLocation(locateEntity(spec, id)!, id)).toBe(
      'task "Train" in the top-level pipeline',
    );
  });

  it("names the subgraph chain for a nested entity", () => {
    const spec = deserialize();
    const id = idOf(subgraphOf(spec, "Preprocess"), "DropNulls");

    expect(describeEntityLocation(locateEntity(spec, id)!, id)).toBe(
      'task "DropNulls" inside subgraph "Preprocess"',
    );
  });
});

describe("resolveTarget", () => {
  it("resolves a nested entity to the spec that owns it", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");

    const resolved = resolveTarget(spec, idOf(preprocess, "DropNulls"), "task");

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.location.spec).toBe(preprocess);
    expect(resolved.location.entity.name).toBe("DropNulls");
  });

  it("reports an id that exists nowhere", () => {
    const resolved = resolveTarget(deserialize(), "nope", "task");

    expect(resolved).toEqual({
      ok: false,
      error: 'No task with $id "nope" exists in this pipeline.',
    });
  });

  it("reports an id that names a different kind of entity", () => {
    const spec = deserialize();
    const inputId = spec.inputs[0].$id;

    const resolved = resolveTarget(spec, inputId, "task");

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(resolved.error).toBe(
      `$id "${inputId}" refers to input "raw_path", not a task.`,
    );
  });
});

describe("resolveConnectable", () => {
  it("accepts tasks and ports", () => {
    const spec = deserialize();

    expect(resolveConnectable(spec, idOf(spec, "Train")).ok).toBe(true);
    expect(resolveConnectable(spec, spec.inputs[0].$id).ok).toBe(true);
    expect(resolveConnectable(spec, spec.outputs[0].$id).ok).toBe(true);
  });

  it("rejects an existing connection, which is not an endpoint", () => {
    const spec = deserialize();
    spec.addBinding(
      new Binding({
        $id: "bind_1",
        sourceEntityId: spec.inputs[0].$id,
        sourcePortName: "raw_path",
        targetEntityId: idOf(spec, "Train"),
        targetPortName: "path",
      }),
    );

    const resolved = resolveConnectable(spec, "bind_1");

    expect(resolved).toEqual({
      ok: false,
      error:
        '$id "bind_1" refers to an existing connection, not a task or port that can be connected.',
    });
  });
});

describe("applyToTarget", () => {
  it("hands the owning spec to the mutation and reports success", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const id = idOf(preprocess, "DropNulls");

    const seen: ComponentSpec[] = [];
    const result = applyToTarget(spec, id, "task", (location) => {
      seen.push(location.spec);
      return true;
    });

    expect(result).toEqual({ success: true });
    expect(seen).toEqual([preprocess]);
  });

  it("names the entity and its subgraph when the mutation refuses", () => {
    const spec = deserialize();
    const id = idOf(subgraphOf(spec, "Preprocess"), "DropNulls");

    const result = applyToTarget(spec, id, "task", () => false);

    expect(result).toEqual({
      success: false,
      error:
        'The requested change to task "DropNulls" inside subgraph "Preprocess" could not be applied.',
    });
  });

  it("prefers an explained refusal and never runs the mutation", () => {
    const spec = deserialize();
    let ran = false;

    const result = applyToTarget(
      spec,
      idOf(spec, "Train"),
      "task",
      () => {
        ran = true;
        return true;
      },
      () => "Because I said so.",
    );

    expect(result).toEqual({ success: false, error: "Because I said so." });
    expect(ran).toBe(false);
  });
});

describe("explainNameCollision", () => {
  it("explains a name already taken in the same graph", () => {
    const spec = deserialize();
    const id = idOf(spec, "Train");

    const message = explainNameCollision(
      spec.tasks,
      id,
      "Preprocess",
      locateEntity(spec, id)!,
    );

    expect(message).toBe(
      'Cannot rename task "Train" in the top-level pipeline to "Preprocess" — that name is already taken in that graph. Pick a different name.',
    );
  });

  it("allows a free name, and allows an entity to keep its own", () => {
    const spec = deserialize();
    const id = idOf(spec, "Train");
    const location = locateEntity(spec, id)!;

    expect(
      explainNameCollision(spec.tasks, id, "Retrain", location),
    ).toBeUndefined();
    expect(
      explainNameCollision(spec.tasks, id, "Train", location),
    ).toBeUndefined();
  });

  it("ignores a same name in a different graph", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const id = idOf(preprocess, "DropNulls");

    expect(
      explainNameCollision(
        preprocess.tasks,
        id,
        "Train",
        locateEntity(spec, id)!,
      ),
    ).toBeUndefined();
  });
});

describe("explainNotASubgraph", () => {
  it("passes a real subgraph", () => {
    const spec = deserialize();
    const id = idOf(spec, "Preprocess");

    expect(explainNotASubgraph(taskLocation(spec, id), id)).toBeUndefined();
  });

  it("explains a container task that has nothing to unpack", () => {
    const spec = deserialize();
    const id = idOf(spec, "Train");

    expect(explainNotASubgraph(taskLocation(spec, id), id)).toBe(
      'task "Train" in the top-level pipeline is not a subgraph, so there is nothing to unpack.',
    );
  });
});

describe("resolveArgumentValue", () => {
  it("passes a plain value through untouched", () => {
    const spec = deserialize();
    const location = taskLocation(spec, idOf(spec, "Train"));

    expect(resolveArgumentValue(location, "some/path.csv")).toEqual({
      ok: true,
      value: "some/path.csv",
    });
  });

  it("accepts a graph input from the same graph", () => {
    const spec = deserialize();
    const location = taskLocation(spec, idOf(spec, "Train"));
    const value = { graphInput: { inputName: "raw_path" } };

    expect(resolveArgumentValue(location, value)).toEqual({ ok: true, value });
  });

  it("refuses a graph input that lives in the parent graph", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const location = taskLocation(spec, idOf(preprocess, "DropNulls"));

    const resolved = resolveArgumentValue(location, {
      graphInput: { inputName: "raw_path" },
    });

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(resolved.error).toContain(
      'Subgraph "Preprocess" has no input named "raw_path"',
    );
    expect(resolved.error).toContain("cannot be referenced across a subgraph");
  });

  it("refuses a task output produced in another graph", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const location = taskLocation(spec, idOf(preprocess, "Normalize"));

    const resolved = resolveArgumentValue(location, {
      taskOutput: { taskId: "Train", outputName: "model" },
    });

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(resolved.error).toContain(
      'Subgraph "Preprocess" has no task "Train"',
    );
  });

  it("normalizes a task output referenced by $id to the task name", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const location = taskLocation(spec, idOf(preprocess, "Normalize"));

    const resolved = resolveArgumentValue(location, {
      taskOutput: {
        taskId: idOf(preprocess, "DropNulls"),
        outputName: "table",
      },
    });

    expect(resolved).toEqual({
      ok: true,
      value: { taskOutput: { taskId: "DropNulls", outputName: "table" } },
    });
  });

  it("refuses an output the source task does not have", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const location = taskLocation(spec, idOf(preprocess, "Normalize"));

    const resolved = resolveArgumentValue(location, {
      taskOutput: { taskId: "DropNulls", outputName: "nope" },
    });

    expect(resolved).toEqual({
      ok: false,
      error: 'Task "DropNulls" has no output named "nope".',
    });
  });
});
