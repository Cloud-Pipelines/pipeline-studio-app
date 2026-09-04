import { describe, expect, it } from "vitest";

import { ComponentSpec, serializeComponentSpec } from "@/models/componentSpec";
import { updateRunNameTemplate } from "@/routes/v2/pages/Editor/store/actions/pipeline.actions";
import { RUN_NAME_TEMPLATE_ANNOTATION } from "@/utils/annotations";

const noopUndo = {
  withGroup: <T>(_label: string, fn: () => T): T => fn(),
};

const makeSpec = () => new ComponentSpec({ $id: "spec_1", name: "Pipeline" });

describe("updateRunNameTemplate", () => {
  it("stores the template so it survives serialization to the wire spec", () => {
    const spec = makeSpec();

    updateRunNameTemplate(noopUndo, spec, "${arguments.dataset}-run");

    expect(spec.annotations.get(RUN_NAME_TEMPLATE_ANNOTATION)).toBe(
      "${arguments.dataset}-run",
    );
    expect(
      serializeComponentSpec(spec).metadata?.annotations?.[
        RUN_NAME_TEMPLATE_ANNOTATION
      ],
    ).toBe("${arguments.dataset}-run");
  });

  it("removes the annotation when the template is cleared", () => {
    const spec = makeSpec();
    updateRunNameTemplate(noopUndo, spec, "${date.timestamp}");

    updateRunNameTemplate(noopUndo, spec, undefined);

    expect(spec.annotations.has(RUN_NAME_TEMPLATE_ANNOTATION)).toBe(false);
    expect(spec.annotations.get(RUN_NAME_TEMPLATE_ANNOTATION)).toBe("");
  });
});
