import { afterEach, describe, expect, it } from "vitest";

import type { PipelineStorageDb } from "../db";
import type { FolderEntry, PipelineRegistryEntry } from "../types";
import { HOST_FOLDER_ID, ROOT_FOLDER_ID } from "../types";
import { PIPELINE_STORAGE_HOST_VERSION } from "./contract";
import { syncHostFolder } from "./hostFolder";

function createFakeDb(seed: {
  folders?: FolderEntry[];
  registry?: PipelineRegistryEntry[];
}) {
  const folders = new Map((seed.folders ?? []).map((f) => [f.id, f]));
  const registry = new Map((seed.registry ?? []).map((e) => [e.id, e]));

  const db = {
    folders: {
      get: async (id: string) => folders.get(id),
      add: async (entry: FolderEntry) => {
        folders.set(entry.id, entry);
      },
      update: async (id: string, changes: Partial<FolderEntry>) => {
        const existing = folders.get(id);
        if (existing) folders.set(id, { ...existing, ...changes });
      },
      delete: async (id: string) => {
        folders.delete(id);
      },
    },
    pipeline_registry: {
      where: (field: keyof PipelineRegistryEntry) => ({
        equals: (value: string) => ({
          delete: async () => {
            for (const [id, entry] of registry) {
              if (entry[field] === value) registry.delete(id);
            }
          },
        }),
      }),
    },
    transaction: async (
      _mode: string,
      _a: unknown,
      _b: unknown,
      body: () => Promise<void>,
    ) => body(),
  };

  return { db: db as unknown as PipelineStorageDb, folders, registry };
}

function installHost(label: string) {
  Object.defineProperty(window, "__TANGLE_PIPELINE_STORAGE_HOST__", {
    value: {
      version: PIPELINE_STORAGE_HOST_VERSION,
      label,
      list: async () => [],
      read: async () => ({}),
      write: async () => ({}),
      delete: async () => undefined,
      has: async () => false,
    },
    configurable: true,
    writable: true,
  });
}

function hostFolderEntry(name = "Shared storage"): FolderEntry {
  return {
    id: HOST_FOLDER_ID,
    name,
    parentId: ROOT_FOLDER_ID,
    driverConfig: { driverType: "host" },
    createdAt: 0,
  };
}

function localFolderEntry(): FolderEntry {
  return {
    id: "local-folder",
    name: "My folder",
    parentId: ROOT_FOLDER_ID,
    driverConfig: { driverType: "folder-indexdb", folderId: "local-folder" },
    createdAt: 0,
  };
}

afterEach(() => {
  delete window.__TANGLE_PIPELINE_STORAGE_HOST__;
});

describe("syncHostFolder with a host present", () => {
  it("adds the folder under the host's label", async () => {
    installHost("Shared storage");
    const { db, folders } = createFakeDb({});

    await syncHostFolder(db);

    expect(folders.get(HOST_FOLDER_ID)).toMatchObject({
      name: "Shared storage",
      parentId: ROOT_FOLDER_ID,
      driverConfig: { driverType: "host" },
    });
  });

  it("adds the folder only once", async () => {
    installHost("Shared storage");
    const { db, folders } = createFakeDb({});

    await syncHostFolder(db);
    const created = folders.get(HOST_FOLDER_ID);
    await syncHostFolder(db);

    expect(folders.get(HOST_FOLDER_ID)).toBe(created);
  });

  it("follows a label the host has changed", async () => {
    installHost("Team storage");
    const { db, folders } = createFakeDb({
      folders: [hostFolderEntry("Shared storage")],
    });

    await syncHostFolder(db);

    expect(folders.get(HOST_FOLDER_ID)?.name).toBe("Team storage");
  });
});

describe("syncHostFolder with no host present", () => {
  it("removes a folder left behind by an earlier page load", async () => {
    const { db, folders } = createFakeDb({ folders: [hostFolderEntry()] });

    await syncHostFolder(db);

    expect(folders.has(HOST_FOLDER_ID)).toBe(false);
  });

  it("removes the registry rows that described the host's files", async () => {
    const { db, registry } = createFakeDb({
      folders: [hostFolderEntry()],
      registry: [
        { id: "remote-1", storageKey: "opaque-1", folderId: HOST_FOLDER_ID },
        { id: "local-1", storageKey: "My pipeline", folderId: ROOT_FOLDER_ID },
      ],
    });

    await syncHostFolder(db);

    expect([...registry.keys()]).toEqual(["local-1"]);
  });

  it("keeps a local row's record of what it already copied to the host", async () => {
    const { db, registry } = createFakeDb({
      folders: [hostFolderEntry()],
      registry: [
        {
          id: "local-1",
          storageKey: "My pipeline",
          folderId: ROOT_FOLDER_ID,
          remoteStorageKey: "opaque-1",
        },
      ],
    });

    await syncHostFolder(db);

    expect(registry.get("local-1")?.remoteStorageKey).toBe("opaque-1");
  });

  it("leaves every other folder alone", async () => {
    const { db, folders } = createFakeDb({
      folders: [hostFolderEntry(), localFolderEntry()],
    });

    await syncHostFolder(db);

    expect([...folders.keys()]).toEqual(["local-folder"]);
  });

  it("does nothing when there is no host folder to remove", async () => {
    const { db, folders } = createFakeDb({ folders: [localFolderEntry()] });

    await syncHostFolder(db);

    expect([...folders.keys()]).toEqual(["local-folder"]);
  });
});
