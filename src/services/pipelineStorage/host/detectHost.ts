import {
  PIPELINE_STORAGE_HOST_VERSION,
  type PipelineStorageHost,
} from "./contract";

const HOST_METHODS = [
  "list",
  "read",
  "write",
  "delete",
  "has",
] as const satisfies readonly (keyof PipelineStorageHost)[];

/**
 * The host page and this app deploy independently, so a contract version we do
 * not understand has to read as "no host at all" rather than as a host we can
 * half-drive. Every failure mode — missing global, wrong shape, throwing
 * getter, newer version — resolves to `undefined` and leaves local storage as
 * the only storage.
 */
export function getPipelineStorageHost(): PipelineStorageHost | undefined {
  try {
    if (typeof window === "undefined") return undefined;

    const host = window.__TANGLE_PIPELINE_STORAGE_HOST__;
    if (!host || typeof host !== "object") return undefined;
    if (typeof host.version !== "number") return undefined;
    if (host.version > PIPELINE_STORAGE_HOST_VERSION) return undefined;
    if (typeof host.label !== "string" || host.label.trim() === "") {
      return undefined;
    }
    if (HOST_METHODS.some((method) => typeof host[method] !== "function")) {
      return undefined;
    }

    return host;
  } catch {
    return undefined;
  }
}
