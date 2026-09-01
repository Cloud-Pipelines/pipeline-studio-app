import { describe, expect, it } from "vitest";

import {
  inferTypeFromUri,
  isVisualizableType,
  normalizeRawType,
  resolveArtifactType,
} from "./artifactType";

describe("resolveArtifactType", () => {
  it("resolves URL aliases", () => {
    expect(resolveArtifactType(normalizeRawType("URL"))).toBe("url");
    expect(resolveArtifactType(normalizeRawType("URI"))).toBe("url");
    expect(resolveArtifactType(normalizeRawType("Link"))).toBe("url");
  });
});

describe("isVisualizableType", () => {
  it("treats url as visualizable", () => {
    expect(isVisualizableType("url")).toBe(true);
  });
});

describe("inferTypeFromUri", () => {
  it("infers url from a .uri extension", () => {
    expect(inferTypeFromUri("gs://bucket/output.uri")).toBe("url");
  });
});
