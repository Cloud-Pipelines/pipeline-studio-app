import { describe, expect, it } from "vitest";

import type { InputSpec } from "../componentSpec";
import { createInputNode } from "./createInputNode";

const input = (overrides: Partial<InputSpec> = {}): InputSpec => ({
  name: "dataset",
  ...overrides,
});

describe("createInputNode", () => {
  it("prefixes the input name to build the node id and exposes it as the label", () => {
    const node = createInputNode(input(), {});

    expect(node.id).toBe("input_dataset");
    expect(node.type).toBe("input");
    expect(node.data.label).toBe("dataset");
  });

  it("reads the position from the editor.position annotation", () => {
    const node = createInputNode(
      input({
        annotations: { "editor.position": JSON.stringify({ x: 10, y: 20 }) },
      }),
      {},
    );

    expect(node.position).toEqual({ x: 10, y: 20 });
  });

  it("falls back to the origin when the position annotation is absent", () => {
    const node = createInputNode(input(), {});

    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it("defaults zIndex to 0 and reads it from the annotation when present", () => {
    expect(createInputNode(input(), {}).zIndex).toBe(0);
    expect(
      createInputNode(input({ annotations: { zIndex: -5 } }), {}).zIndex,
    ).toBe(-5);
  });

  it("carries the remaining input spec fields into the node data", () => {
    const node = createInputNode(
      input({
        type: "String",
        description: "Training data",
        default: "gs://bucket/data",
        optional: true,
      }),
      {},
    );

    expect(node.data).toEqual(
      expect.objectContaining({
        type: "String",
        description: "Training data",
        default: "gs://bucket/data",
        optional: true,
      }),
    );
  });

  it("does not copy name or annotations into the node data", () => {
    const node = createInputNode(input({ annotations: { zIndex: 1 } }), {});

    expect(node.data.name).toBeUndefined();
    expect(node.data.annotations).toBeUndefined();
  });

  it("lets nodeData win over a colliding input spec field", () => {
    const node = createInputNode(input({ description: "from spec" }), {
      description: "from nodeData",
    });

    expect(node.data.description).toBe("from nodeData");
  });

  it("defaults readOnly to false and lets the argument override nodeData", () => {
    expect(createInputNode(input(), {}).data.readOnly).toBe(false);
    expect(createInputNode(input(), {}, true).data.readOnly).toBe(true);
    // The readOnly argument is spread last, so it wins over nodeData.readOnly.
    expect(createInputNode(input(), { readOnly: true }).data.readOnly).toBe(
      false,
    );
  });
});
