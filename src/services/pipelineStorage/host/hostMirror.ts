import type { PipelineFile } from "../PipelineFile";
import {
  findById,
  findByRemoteStorageKey,
  updateEntry,
} from "../pipelineRegistry";
import { HOST_DRIVER_TYPE } from "../types";
import { getPipelineStorageHost } from "./detectHost";

/**
 * Copies a locally-stored pipeline to the host the first time it is saved with
 * a host present, so a person's existing work becomes reachable there without a
 * bulk migration. The local copy is authoritative and is never removed.
 */
export async function mirrorWriteToHost(
  file: PipelineFile,
  content: string,
): Promise<void> {
  if (file.folder.driver.type === HOST_DRIVER_TYPE) return;

  const host = getPipelineStorageHost();
  if (!host) return;

  const entry = await findById(file.id);
  if (!entry || entry.remoteStorageKey) return;

  const { HostStorageDriver } = await import("../drivers/HostStorageDriver");
  const remoteStorageKey = crypto.randomUUID();
  await new HostStorageDriver(host).write(remoteStorageKey, content);
  await updateEntry(file.id, { remoteStorageKey });
}

/**
 * A key the host has deleted must never be written to again: the host may
 * revive the deleted record rather than mint a new one, and the pipeline would
 * come back wearing the dead record's identity. Forgetting the key is what
 * makes the next save create a fresh record instead.
 */
export async function clearMirrorsOfHostKey(
  remoteStorageKey: string,
): Promise<void> {
  const mirrored = await findByRemoteStorageKey(remoteStorageKey);

  for (const entry of mirrored) {
    await updateEntry(entry.id, { remoteStorageKey: undefined });
  }
}
