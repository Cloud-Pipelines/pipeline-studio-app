import { describe, expect, test } from "vitest";

import { artifactDiffLanguage, normalizeForDiff } from "./artifactTextDiff";

describe("artifactDiffLanguage()", () => {
  test("diffs json artifacts as json", () => {
    expect(artifactDiffLanguage("jsonobject", "jsonobject")).toBe("json");
    expect(artifactDiffLanguage("jsonarray", "jsonarray")).toBe("json");
  });

  test("diffs text and delimited artifacts as plain text", () => {
    expect(artifactDiffLanguage("text", "text")).toBe("plaintext");
    expect(artifactDiffLanguage("csv", "csv")).toBe("plaintext");
    expect(artifactDiffLanguage("tsv", "tsv")).toBe("plaintext");
  });

  test("falls back to plain text when the two runs produced different types", () => {
    expect(artifactDiffLanguage("jsonobject", "text")).toBe("plaintext");
    expect(artifactDiffLanguage("csv", "tsv")).toBe("plaintext");
  });

  test("cannot diff types without a line-oriented form", () => {
    expect(artifactDiffLanguage("image", "image")).toBeUndefined();
    expect(
      artifactDiffLanguage("apacheparquet", "apacheparquet"),
    ).toBeUndefined();
    expect(artifactDiffLanguage("text", "image")).toBeUndefined();
    expect(artifactDiffLanguage("any", "any")).toBeUndefined();
  });
});

describe("normalizeForDiff()", () => {
  test("re-prints minified json so the diff lands on changed fields", () => {
    expect(normalizeForDiff('{"a":1,"b":[2,3]}', "json")).toBe(
      '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
    );
  });

  test("leaves unparseable json untouched", () => {
    expect(normalizeForDiff("{not json", "json")).toBe("{not json");
  });

  test("leaves plain text untouched", () => {
    const text = '{"a":1}';
    expect(normalizeForDiff(text, "plaintext")).toBe(text);
  });
});
