import { afterEach, describe, expect, it } from "vitest";

import {
  PIPELINE_STORAGE_HOST_VERSION,
  type PipelineStorageHost,
} from "./contract";
import { getPipelineStorageHost } from "./detectHost";

function installHost(host: unknown) {
  Object.defineProperty(window, "__TANGLE_PIPELINE_STORAGE_HOST__", {
    value: host,
    configurable: true,
    writable: true,
  });
}

function createFakeHost(
  overrides: Partial<Record<keyof PipelineStorageHost, unknown>> = {},
) {
  return {
    version: PIPELINE_STORAGE_HOST_VERSION,
    label: "Shared storage",
    list: async () => [],
    read: async () => ({}),
    write: async () => ({}),
    delete: async () => undefined,
    has: async () => false,
    ...overrides,
  };
}

afterEach(() => {
  delete window.__TANGLE_PIPELINE_STORAGE_HOST__;
});

describe("getPipelineStorageHost", () => {
  it("returns the host when the global satisfies the contract", () => {
    const host = createFakeHost();
    installHost(host);

    expect(getPipelineStorageHost()).toBe(host);
  });

  it("returns undefined when the global is missing", () => {
    expect(getPipelineStorageHost()).toBeUndefined();
  });

  it.each(["list", "read", "write", "delete", "has"] as const)(
    "returns undefined when %s is not a function",
    (method) => {
      installHost(createFakeHost({ [method]: "not-callable" }));

      expect(getPipelineStorageHost()).toBeUndefined();
    },
  );

  it("returns undefined when the version is above the supported version", () => {
    installHost(createFakeHost({ version: PIPELINE_STORAGE_HOST_VERSION + 1 }));

    expect(getPipelineStorageHost()).toBeUndefined();
  });

  it("accepts a host declaring an older version", () => {
    const host = createFakeHost({ version: PIPELINE_STORAGE_HOST_VERSION - 1 });
    installHost(host);

    expect(getPipelineStorageHost()).toBe(host);
  });

  it("returns undefined when the version is not a number", () => {
    installHost(createFakeHost({ version: "1" }));

    expect(getPipelineStorageHost()).toBeUndefined();
  });

  it.each([undefined, "", "   "])(
    "returns undefined when the label is %p",
    (label) => {
      installHost(createFakeHost({ label }));

      expect(getPipelineStorageHost()).toBeUndefined();
    },
  );

  it("returns undefined when the global is not an object", () => {
    installHost("a host, honest");

    expect(getPipelineStorageHost()).toBeUndefined();
  });

  it("returns undefined when reading the global throws", () => {
    Object.defineProperty(window, "__TANGLE_PIPELINE_STORAGE_HOST__", {
      get() {
        throw new Error("cross-origin");
      },
      configurable: true,
    });

    expect(getPipelineStorageHost()).toBeUndefined();
  });
});
