import { Dexie, type EntityTable } from "dexie";

import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import { getPipelineStorageHost } from "./host/detectHost";
import {
  type FolderEntry,
  HOST_FOLDER_ID,
  type PipelineRegistryEntry,
  ROOT_FOLDER_ID,
} from "./types";

export const pipelineStorageDb = new Dexie("tangle_pipelines") as Dexie & {
  pipeline_registry: EntityTable<PipelineRegistryEntry, "id">;
  folders: EntityTable<FolderEntry, "id">;
};

pipelineStorageDb.version(1).stores({
  pipeline_registry: "id, &storageKey, folderId, [folderId+storageKey]",
  folders: "id, parentId",
});

pipelineStorageDb.version(2).stores({
  pipeline_registry:
    "id, &storageKey, folderId, [folderId+storageKey], remoteStorageKey",
  folders: "id, parentId",
});

pipelineStorageDb.on("ready", async () => {
  await seedRegistryFromLegacyList();
  await seedHostFolder();
});

async function seedRegistryFromLegacyList() {
  const count = await pipelineStorageDb.pipeline_registry.count();
  if (count > 0) return;

  const { getAllComponentFilesFromList } =
    await import("@/utils/componentStore");
  const knownPipelines = await getAllComponentFilesFromList(
    USER_PIPELINES_LIST_NAME,
  );

  if (knownPipelines.size === 0) return;

  const pipelineForRegistry = [...knownPipelines.entries()].map(
    ([storageKey]) => ({
      id: crypto.randomUUID(),
      storageKey,
      folderId: ROOT_FOLDER_ID,
    }),
  );

  try {
    /**
     * This code may be revisited to ensure stability and performance.
     */
    pipelineForRegistry.forEach(async (row) => {
      await pipelineStorageDb.pipeline_registry.upsert(row.id, row);
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function seedHostFolder() {
  const host = getPipelineStorageHost();
  if (!host) return;

  const existing = await pipelineStorageDb.folders.get(HOST_FOLDER_ID);

  if (!existing) {
    await pipelineStorageDb.folders.add({
      id: HOST_FOLDER_ID,
      name: host.label,
      parentId: ROOT_FOLDER_ID,
      driverConfig: { driverType: "host" },
      createdAt: Date.now(),
    });
    return;
  }

  if (existing.name !== host.label) {
    await pipelineStorageDb.folders.update(HOST_FOLDER_ID, {
      name: host.label,
    });
  }
}
