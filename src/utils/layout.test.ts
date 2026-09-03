import { describe, expect, it } from "vitest";

import { TOP_NAV_HEIGHT } from "./constants";
import { contentHeight } from "./layout";

describe("contentHeight", () => {
  it("subtracts the top nav from the viewport height", () => {
    expect(contentHeight()).toBe(`calc(100vh - ${TOP_NAV_HEIGHT}px - 0px)`);
  });

  it("subtracts an additional fixed amount on top of the nav", () => {
    expect(contentHeight(48)).toBe(`calc(100vh - ${TOP_NAV_HEIGHT}px - 48px)`);
  });

  it("treats an explicit zero the same as no argument", () => {
    expect(contentHeight(0)).toBe(contentHeight());
  });
});
