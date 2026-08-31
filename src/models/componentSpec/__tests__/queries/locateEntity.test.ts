import { describe, expect, it } from "vitest";

import type { ComponentSpec } from "@/models/componentSpec";
import { Binding } from "@/models/componentSpec/entities/binding";
import { IncrementingIdGenerator } from "@/models/componentSpec/factories/idGenerator";
import {
  locatedEntityName,
  locateEntity,
} from "@/models/componentSpec/queries/locateEntity";
import { YamlDeserializer } from "@/models/componentSpec/serialization/yamlDeserializer";

const containerComponent = (name: string, image: string) => ({
  name,
  spec: {
    name,
    inputs: [{ name: "path", type: "String" }],
    outputs: [{ name: "table", type: "String" }],
    implementation: { container: { image } },
  },
});

const pipelineYaml = {
  name: "RootPipeline",
  inputs: [{ name: "raw_path", type: "String" }],
  outputs: [{ name: "model", type: "String" }],
  implementation: {
    graph: {
      tasks: {
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
                    Normalize: {
                      componentRef: {
                        name: "Normalize",
                        spec: {
                          name: "Normalize",
                          inputs: [{ name: "path", type: "String" }],
                          outputs: [{ name: "table", type: "String" }],
                          implementation: {
                            graph: {
                              tasks: {
                                ScaleColumns: {
                                  componentRef: containerComponent(
                                    "ScaleColumns",
                                    "scale:1",
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
            },
          },
        },
        Train: { componentRef: containerComponent("Train", "train:1") },
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

describe("locateEntity", () => {
  it("locates a root task with an empty subgraph path", () => {
    const spec = deserialize();
    const train = spec.tasks.find((t) => t.name === "Train");

    const location = locateEntity(spec, train!.$id);

    expect(location).toMatchObject({ kind: "task", subgraphPath: [] });
    expect(locatedEntityName(location!)).toBe("Train");
    expect(location?.spec).toBe(spec);
    expect(location?.entity).toBe(train);
  });

  it("returns the owning spec and path for a task one level down", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");
    const normalize = preprocess.tasks.find((t) => t.name === "Normalize");

    const location = locateEntity(spec, normalize!.$id);

    expect(location?.subgraphPath).toEqual(["Preprocess"]);
    expect(location?.spec).toBe(preprocess);
  });

  it("builds the full path for a deeply nested task", () => {
    const spec = deserialize();
    const normalizeSpec = subgraphOf(
      subgraphOf(spec, "Preprocess"),
      "Normalize",
    );
    const scale = normalizeSpec.tasks.find((t) => t.name === "ScaleColumns");

    const location = locateEntity(spec, scale!.$id);

    expect(location).toMatchObject({
      kind: "task",
      subgraphPath: ["Preprocess", "Normalize"],
    });
    expect(locatedEntityName(location!)).toBe("ScaleColumns");
    expect(location?.spec).toBe(normalizeSpec);
  });

  it("distinguishes inputs, outputs and bindings from tasks", () => {
    const spec = deserialize();
    spec.addBinding(
      new Binding({
        $id: "bind_1",
        sourceEntityId: spec.inputs[0].$id,
        sourcePortName: "raw_path",
        targetEntityId: spec.tasks[0].$id,
        targetPortName: "path",
      }),
    );

    const input = locateEntity(spec, spec.inputs[0].$id);
    const output = locateEntity(spec, spec.outputs[0].$id);
    const binding = locateEntity(spec, "bind_1");

    expect(input?.kind).toBe("input");
    expect(locatedEntityName(input!)).toBe("raw_path");
    expect(output?.kind).toBe("output");
    expect(locatedEntityName(output!)).toBe("model");
    expect(binding?.kind).toBe("binding");
    expect(locatedEntityName(binding!)).toBeUndefined();
  });

  it("finds an input declared inside a subgraph", () => {
    const spec = deserialize();
    const preprocess = subgraphOf(spec, "Preprocess");

    const location = locateEntity(spec, preprocess.inputs[0].$id);

    expect(location).toMatchObject({
      kind: "input",
      subgraphPath: ["Preprocess"],
    });
    expect(locatedEntityName(location!)).toBe("path");
  });

  it("returns undefined for an unknown id", () => {
    expect(locateEntity(deserialize(), "nope")).toBeUndefined();
  });

  describe("parentContext", () => {
    it("is absent for an entity in the spec that was passed in", () => {
      const spec = deserialize();

      const location = locateEntity(spec, spec.tasks[0].$id);

      expect(location?.parentContext).toBeUndefined();
    });

    it("names the immediate owning spec and subgraph task one level down", () => {
      const spec = deserialize();
      const preprocessTask = spec.tasks.find((t) => t.name === "Preprocess");
      const normalize = subgraphOf(spec, "Preprocess").tasks[0];

      const location = locateEntity(spec, normalize.$id);

      expect(location?.parentContext?.parentSpec).toBe(spec);
      expect(location?.parentContext?.taskId).toBe(preprocessTask?.$id);
    });

    it("names the immediate parent rather than the root for a deep entity", () => {
      const spec = deserialize();
      const preprocess = subgraphOf(spec, "Preprocess");
      const normalizeTask = preprocess.tasks.find(
        (t) => t.name === "Normalize",
      );
      const scale = subgraphOf(preprocess, "Normalize").tasks[0];

      const location = locateEntity(spec, scale.$id);

      expect(location?.parentContext?.parentSpec).toBe(preprocess);
      expect(location?.parentContext?.taskId).toBe(normalizeTask?.$id);
    });
  });
});
