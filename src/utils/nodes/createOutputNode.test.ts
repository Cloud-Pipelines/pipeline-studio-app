import { describe, expect, it } from "vitest";

import type { OutputSpec } from "../componentSpec";
import { createOutputNode } from "./createOutputNode";

const output = (overrides: Partial<OutputSpec> = {}): OutputSpec => ({
  name: "model",
  ...overrides,
});

describe("createOutputNode", () => {
  it("prefixes the output name to build the node id and exposes it as the label", () => {
    const node = createOutputNode(output(), {});

    expect(node.id).toBe("output_model");
    expect(node.type).toBe("output");
    expect(node.data.label).toBe("model");
  });

  it("reads the position from the editor.position annotation", () => {
    const node = createOutputNode(
      output({
        annotations: { "editor.position": JSON.stringify({ x: 5, y: 15 }) },
      }),
      {},
    );

    expect(node.position).toEqual({ x: 5, y: 15 });
  });

  it("falls back to the origin when the position annotation is absent", () => {
    const node = createOutputNode(output(), {});

    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it("defaults zIndex to 0 and reads it from the annotation when present", () => {
    expect(createOutputNode(output(), {}).zIndex).toBe(0);
    expect(
      createOutputNode(output({ annotations: { zIndex: 12 } }), {}).zIndex,
    ).toBe(12);
  });

  it("carries the remaining output spec fields into the node data", () => {
    const node = createOutputNode(
      output({ type: "Model", description: "Trained model" }),
      {},
    );

    expect(node.data).toEqual(
      expect.objectContaining({
        type: "Model",
        description: "Trained model",
      }),
    );
  });

  it("does not copy name or annotations into the node data", () => {
    const node = createOutputNode(output({ annotations: { zIndex: 1 } }), {});

    expect(node.data.name).toBeUndefined();
    expect(node.data.annotations).toBeUndefined();
  });

  it("resolves readOnly from the argument, then nodeData, then false", () => {
    expect(createOutputNode(output(), {}).data.readOnly).toBe(false);
    expect(createOutputNode(output(), {}, true).data.readOnly).toBe(true);
    expect(createOutputNode(output(), { readOnly: true }).data.readOnly).toBe(
      true,
    );
    expect(
      createOutputNode(output(), { readOnly: true }, false).data.readOnly,
    ).toBe(false);
  });
});
