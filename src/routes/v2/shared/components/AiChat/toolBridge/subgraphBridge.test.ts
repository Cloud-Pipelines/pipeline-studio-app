import { describe, expect, it } from "vitest";

import type { ComponentReference, ComponentSpec } from "@/models/componentSpec";
import { ComponentSpec as ComponentSpecModel } from "@/models/componentSpec/entities/componentSpec";
import { IncrementingIdGenerator } from "@/models/componentSpec/factories/idGenerator";
import { createTaskFromComponentRef } from "@/models/componentSpec/factories/taskFactory";
import { YamlDeserializer } from "@/models/componentSpec/serialization/yamlDeserializer";
import { serializeSpecForAi } from "@/routes/v2/shared/components/AiChat/serializeSpecForAi";

import { createSubgraphBridgeHandlers } from "./subgraphBridge";
import type { BridgeDeps } from "./utils";

const containerComponent = (name: string, image: string) => ({
  name,
  spec: {
    name,
    inputs: [{ name: "path", type: "String" }],
    outputs: [{ name: "table", type: "String" }],
    implementation: { container: { image } },
  },
});

const preprocessRef: ComponentReference = {
  name: "Preprocess",
  spec: {
    name: "Preprocess",
    inputs: [{ name: "path", type: "String" }],
    outputs: [{ name: "table", type: "String" }],
    implementation: {
      graph: {
        tasks: {
          DropNulls: {
            componentRef: containerComponent("DropNulls", "clean:1"),
            arguments: {
              path: { graphInput: { inputName: "path" } },
            },
          },
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
};

const pipelineYaml = {
  name: "RootPipeline",
  inputs: [{ name: "raw_path", type: "String" }],
  implementation: {
    graph: {
      tasks: {
        Preprocess: {
          componentRef: preprocessRef,
          arguments: { path: { graphInput: { inputName: "raw_path" } } },
        },
        Train: {
          componentRef: containerComponent("Train", "train:1"),
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

function makeDeps(spec: ComponentSpec): BridgeDeps {
  return {
    getSpec: () => spec,
    getActiveSubgraphPath: () => [],
    getActiveSubgraphTaskId: () => undefined,
  };
}

function taskIdByName(spec: ComponentSpec, name: string): string {
  const task = spec.tasks.find((t) => t.name === name);
  if (!task) throw new Error(`No task named ${name}`);
  return task.$id;
}

describe("createSubgraphBridgeHandlers", () => {
  it("does not expose inner tasks through the pipeline-state payload", () => {
    const aiSpec = serializeSpecForAi(deserialize());

    const preprocess = aiSpec.tasks.find((t) => t.name === "Preprocess");
    expect(preprocess?.isSubgraph).toBe(true);
    expect(JSON.stringify(aiSpec)).not.toContain("DropNulls");
  });

  it("returns the inner tasks and bindings of a deserialized subgraph", async () => {
    const spec = deserialize();
    const { getSubgraphState } = createSubgraphBridgeHandlers(makeDeps(spec));

    const result = await getSubgraphState(taskIdByName(spec, "Preprocess"));

    expect(result.success).toBe(true);
    expect(result.spec?.name).toBe("Preprocess");
    expect(result.spec?.tasks.map((t) => t.name)).toEqual([
      "DropNulls",
      "Normalize",
    ]);
    expect(result.spec?.inputs.map((i) => i.name)).toEqual(["path"]);
    expect(result.spec?.bindings.length).toBeGreaterThan(0);
  });

  it("flags a nested subgraph so the model can request the next level", async () => {
    const spec = deserialize();
    const { getSubgraphState } = createSubgraphBridgeHandlers(makeDeps(spec));

    const preprocess = await getSubgraphState(taskIdByName(spec, "Preprocess"));
    const normalize = preprocess.spec?.tasks.find(
      (t) => t.name === "Normalize",
    );
    expect(normalize?.isSubgraph).toBe(true);

    const nested = await getSubgraphState(normalize!.$id);

    expect(nested.success).toBe(true);
    expect(nested.spec?.tasks.map((t) => t.name)).toEqual(["ScaleColumns"]);
  });

  it("reports a task that is not a subgraph", async () => {
    const spec = deserialize();
    const { getSubgraphState } = createSubgraphBridgeHandlers(makeDeps(spec));

    const result = await getSubgraphState(taskIdByName(spec, "Train"));

    expect(result.success).toBe(false);
    expect(result.spec).toBeUndefined();
    expect(result.error).toContain("is not a subgraph");
  });

  it("reports an unknown task id", async () => {
    const spec = deserialize();
    const { getSubgraphState } = createSubgraphBridgeHandlers(makeDeps(spec));

    const result = await getSubgraphState("task_does_not_exist");

    expect(result.success).toBe(false);
    expect(result.error).toContain("task_does_not_exist");
  });

  it("resolves a subgraph added through the task factory", async () => {
    const spec = new ComponentSpecModel({ name: "Root" });
    spec.addTask(
      createTaskFromComponentRef(
        new IncrementingIdGenerator(),
        preprocessRef,
        "Preprocess",
      ),
    );

    const serialized = serializeSpecForAi(spec).tasks[0];
    const { getSubgraphState } = createSubgraphBridgeHandlers(makeDeps(spec));
    const result = await getSubgraphState(serialized.$id);

    expect(serialized.isSubgraph).toBe(true);
    expect(result.success).toBe(true);
    expect(result.spec?.tasks.map((t) => t.name)).toEqual([
      "DropNulls",
      "Normalize",
    ]);
  });

  it("throws a model-friendly error when no pipeline is open", async () => {
    const { getSubgraphState } = createSubgraphBridgeHandlers({
      getSpec: () => null,
      getActiveSubgraphPath: () => [],
      getActiveSubgraphTaskId: () => undefined,
    });

    await expect(getSubgraphState("task_1")).rejects.toThrow(
      "No pipeline is currently open",
    );
  });
});
