import { describe, expect, test } from "vitest";

import { validateCompareSearch } from "./compareSearch";

describe("validateCompareSearch()", () => {
  test("passes string run ids through", () => {
    expect(validateCompareSearch({ a: "run-1", b: "run-2" })).toEqual({
      a: "run-1",
      b: "run-2",
    });
  });

  test("coerces numeric ids the router parsed out of the url", () => {
    expect(validateCompareSearch({ a: 123, b: 456 })).toEqual({
      a: "123",
      b: "456",
    });
  });

  test("drops values that cannot be a run id", () => {
    expect(validateCompareSearch({ a: ["run-1"], b: { id: "run-2" } })).toEqual(
      { a: undefined, b: undefined },
    );
  });

  test("treats blank and whitespace-only ids as absent", () => {
    expect(validateCompareSearch({ a: "", b: "   " })).toEqual({
      a: undefined,
      b: undefined,
    });
  });

  test("tolerates a missing or non-object search object", () => {
    expect(validateCompareSearch(undefined)).toEqual({
      a: undefined,
      b: undefined,
    });
    expect(validateCompareSearch({})).toEqual({ a: undefined, b: undefined });
  });
});
