import { afterEach, describe, expect, it, vi } from "vitest";

import {
  emitPipelineFileChanged,
  getLastForeignWriteTime,
  subscribePipelineFileChanged,
} from "./pipelineFileEvents";

// The module keeps its write times in module scope, so every test uses its own
// storage key rather than resetting shared state.

afterEach(() => {
  vi.useRealTimers();
});

describe("subscribePipelineFileChanged", () => {
  it("delivers the emitted change to the listener", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePipelineFileChanged(listener);

    emitPipelineFileChanged({ storageKey: "deliver", source: "v1" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      storageKey: "deliver",
      source: "v1",
    });

    unsubscribe();
  });

  it("stops delivering once unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePipelineFileChanged(listener);

    unsubscribe();
    emitPipelineFileChanged({ storageKey: "unsubscribed", source: "v2" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies every active listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = subscribePipelineFileChanged(first);
    const unsubscribeSecond = subscribePipelineFileChanged(second);

    emitPipelineFileChanged({ storageKey: "fanout", source: "v1" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });
});

describe("getLastForeignWriteTime", () => {
  it("returns undefined for a storage key that was never written", () => {
    expect(getLastForeignWriteTime("never-written", "v1")).toBeUndefined();
  });

  it("returns undefined when only the asking source has written", () => {
    emitPipelineFileChanged({ storageKey: "own-only", source: "v1" });

    expect(getLastForeignWriteTime("own-only", "v1")).toBeUndefined();
  });

  it("returns the timestamp of a write made by the other source", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    emitPipelineFileChanged({ storageKey: "foreign", source: "v2" });

    expect(getLastForeignWriteTime("foreign", "v1")).toBe(
      Date.parse("2026-01-01T00:00:00.000Z"),
    );
  });

  it("keeps only the most recent write per source", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    emitPipelineFileChanged({ storageKey: "latest", source: "v2" });

    vi.setSystemTime(new Date("2026-01-01T00:05:00.000Z"));
    emitPipelineFileChanged({ storageKey: "latest", source: "v2" });

    expect(getLastForeignWriteTime("latest", "v1")).toBe(
      Date.parse("2026-01-01T00:05:00.000Z"),
    );
  });

  it("does not let a later own-source write mask the foreign write", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    emitPipelineFileChanged({ storageKey: "not-masked", source: "v2" });

    vi.setSystemTime(new Date("2026-01-01T01:00:00.000Z"));
    emitPipelineFileChanged({ storageKey: "not-masked", source: "v1" });

    expect(getLastForeignWriteTime("not-masked", "v1")).toBe(
      Date.parse("2026-01-01T00:00:00.000Z"),
    );
    expect(getLastForeignWriteTime("not-masked", "v2")).toBe(
      Date.parse("2026-01-01T01:00:00.000Z"),
    );
  });

  it("tracks write times per storage key", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    emitPipelineFileChanged({ storageKey: "key-a", source: "v2" });

    expect(getLastForeignWriteTime("key-a", "v1")).toBeDefined();
    expect(getLastForeignWriteTime("key-b", "v1")).toBeUndefined();
  });
});
