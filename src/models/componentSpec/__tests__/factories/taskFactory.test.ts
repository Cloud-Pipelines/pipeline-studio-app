import { describe, expect, it } from "vitest";

import type { ComponentReference } from "../../entities/types";
import { IncrementingIdGenerator } from "../../factories/idGenerator";
import { createTaskFromComponentRef } from "../../factories/taskFactory";

const graphRef: ComponentReference = {
  name: "PublishedSubgraph",
  spec: {
    name: "PublishedSubgraph",
    inputs: [{ name: "path", type: "String" }],
    implementation: {
      graph: {
        tasks: {
          Inner: {
            componentRef: {
              name: "Inner",
              spec: {
                name: "Inner",
                implementation: { container: { image: "inner:1" } },
              },
            },
          },
        },
      },
    },
  },
};

const containerRef: ComponentReference = {
  name: "Train",
  spec: {
    name: "Train",
    inputs: [{ name: "path", type: "String", default: "/data" }],
    implementation: { container: { image: "train:1" } },
  },
};

function create(ref: ComponentReference) {
  return createTaskFromComponentRef(
    new IncrementingIdGenerator(),
    ref,
    "TaskName",
  );
}

describe("createTaskFromComponentRef", () => {
  it("promotes an inline graph spec into subgraphSpec", () => {
    const task = create(graphRef);

    expect(task.subgraphSpec).toBeDefined();
    expect(task.subgraphSpec?.tasks.map((t) => t.name)).toEqual(["Inner"]);
    expect(task.componentRef.spec).toBeUndefined();
    expect(task.isSubgraph).toBe(true);
  });

  it("leaves a container component untouched", () => {
    const task = create(containerRef);

    expect(task.subgraphSpec).toBeUndefined();
    expect(task.componentRef.spec).toEqual(containerRef.spec);
    expect(task.isSubgraph).toBe(false);
  });

  it("still seeds arguments from the incoming ref's inputs", () => {
    expect(create(graphRef).arguments).toEqual([
      { name: "path", value: undefined },
    ]);
    expect(create(containerRef).arguments).toEqual([
      { name: "path", value: "/data" },
    ]);
  });
});
