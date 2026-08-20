import { describe, expect, it } from "vitest";

import { isFalseCondition } from "./conditionalExecution";

describe("isFalseCondition", () => {
  it.each(["false", " FALSE\n", false])("recognizes %p as false", (value) => {
    expect(isFalseCondition(value)).toBe(true);
  });

  it.each(["true", true, undefined])("does not treat %p as false", (value) => {
    expect(isFalseCondition(value)).toBe(false);
  });
});
