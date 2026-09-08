import type { PipelineStorageDb } from "../db";
import { HOST_FOLDER_ID, ROOT_FOLDER_ID } from "../types";
import { getPipelineStorageHost } from "./detectHost";

/**
 * Brings the host folder into line with whether a host is actually on the page,
 * in both directions. Adding it is only half the job: the folder outlives the
 * page that installed it, and a row whose driver cannot be built takes the
 * whole folder listing down with it, so a page loading without a host has to
 * remove the folder rather than leave it behind.
 */
export async function syncHostFolder(db: PipelineStorageDb): Promise<void> {
  const host = getPipelineStorageHost();

  if (!host) {
    await removeHostFolder(db);
    return;
  }

  const existing = await db.folders.get(HOST_FOLDER_ID);

  if (!existing) {
    await db.folders.add({
      id: HOST_FOLDER_ID,
      name: host.label,
      parentId: ROOT_FOLDER_ID,
      driverConfig: { driverType: "host" },
      createdAt: Date.now(),
    });
    return;
  }

  if (existing.name !== host.label) {
    await db.folders.update(HOST_FOLDER_ID, { name: host.label });
  }
}

/**
 * The registry rows go with it. They only ever recorded which local id stood
 * for which remote file, so without the folder they describe nothing, and the
 * pipelines themselves are untouched on the host. Rows elsewhere keep their
 * `remoteStorageKey`, so a pipeline already copied to the host is not copied
 * again when the host returns.
 */
async function removeHostFolder(db: PipelineStorageDb): Promise<void> {
  const existing = await db.folders.get(HOST_FOLDER_ID);
  if (!existing) return;

  await db.transaction("rw", db.folders, db.pipeline_registry, async () => {
    await db.pipeline_registry
      .where("folderId")
      .equals(HOST_FOLDER_ID)
      .delete();
    await db.folders.delete(HOST_FOLDER_ID);
  });
}
