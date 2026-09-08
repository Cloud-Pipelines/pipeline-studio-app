import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import yaml from "js-yaml";
import {
  registerRootStore,
  type UndoStore as MobxUndoStore,
} from "mobx-keystone";
import { useEffect, useRef } from "react";

import {
  type ComponentSpec,
  type IdGenerator,
  IncrementingIdGenerator,
  ReplayIdGenerator,
  YamlDeserializer,
} from "@/models/componentSpec";
import { hydrateLoadedSpecRefs } from "@/routes/v2/pages/Editor/utils/hydrateSpecRefs";
import {
  createUndoStoreWithEvents,
  loadUndoHistory,
} from "@/routes/v2/pages/Editor/utils/undoHistoryStorage";
import { RootFolderDbStorageDriver } from "@/services/pipelineStorage/drivers/RootFolderDbStorageDriver";
import type { PipelineFile } from "@/services/pipelineStorage/PipelineFile";
import {
  getLastForeignWriteTime,
  subscribePipelineFileChanged,
} from "@/services/pipelineStorage/pipelineFileEvents";
import { usePipelineStorage } from "@/services/pipelineStorage/PipelineStorageProvider";
import type { PipelineStorageService } from "@/services/pipelineStorage/PipelineStorageService";
import type { PipelineRef } from "@/services/pipelineStorage/types";
import { PIPELINE_YAML_LOAD_OPTIONS } from "@/utils/yaml";

interface LoadedSpec {
  spec: ComponentSpec;
  restoredUndoStore?: MobxUndoStore;
}

function deserializeSpec(data: unknown, idGen?: IdGenerator): ComponentSpec {
  const generator = idGen ?? new IncrementingIdGenerator();
  const deserializer = new YamlDeserializer(generator);
  const spec = deserializer.deserialize(data);
  registerRootStore(spec);
  return spec;
}

async function backfillFromLegacyStore(
  name: string,
  storage: PipelineStorageService,
): Promise<PipelineFile | undefined> {
  const legacyDriver = new RootFolderDbStorageDriver();

  const existsInLegacy = await legacyDriver.hasKey(name);
  if (!existsInLegacy) return undefined;

  return storage.rootFolder.assignFile(name);
}

async function resolvePipelineFile(
  ref: PipelineRef,
  storage: PipelineStorageService,
): Promise<PipelineFile> {
  let pipelineFile = ref.fileId
    ? await storage.findPipelineById(ref.fileId)
    : await storage.resolvePipelineByName(ref.name);

  if (!pipelineFile) {
    pipelineFile = await backfillFromLegacyStore(ref.name, storage);
  }

  if (!pipelineFile) {
    throw new Error(`Pipeline "${ref.name}" not found`);
  }

  return pipelineFile;
}

export const EDITOR_SPEC_QUERY_KEY = "editor-v2-spec";

export function useLoadSpec(ref: PipelineRef) {
  const storage = usePipelineStorage();
  const queryClient = useQueryClient();
  const queryKey = [EDITOR_SPEC_QUERY_KEY, ref.fileId ?? ref.name];
  const loadedStorageKey = useRef<string | undefined>(undefined);

  // When something outside this editor writes the same file, drop our cached
  // deserialization so the next read of this query goes back to storage. We
  // ignore "v2" emissions because those are our own autosaves — reloading the
  // spec under our feet would discard MobX editor state (selection, undo, …)
  // and the in-memory model is already authoritative for v2.
  useEffect(() => {
    const matchKey = [EDITOR_SPEC_QUERY_KEY, ref.fileId ?? ref.name];

    // Writes are announced by storage key. Matching on ref.name only holds
    // while the route param and the storage key are the same string, which a
    // store with opaque keys breaks — and the symptom is silent: the editor
    // just stops reloading. Compare against the key of the file this query
    // actually loaded, falling back to ref.name until it resolves.
    const matchedKey = () => loadedStorageKey.current ?? ref.name;

    const state = queryClient.getQueryState(matchKey);
    const lastFetched = state?.dataUpdatedAt;
    if (lastFetched !== undefined) {
      const lastForeign = getLastForeignWriteTime(matchedKey(), "v2") ?? 0;
      if (lastForeign > lastFetched) {
        queryClient.invalidateQueries({ queryKey: matchKey });
      }
    }

    return subscribePipelineFileChanged(({ storageKey, source }) => {
      if (source === "v2") return;
      if (storageKey !== matchedKey()) return;
      queryClient.invalidateQueries({ queryKey: matchKey });
    });
  }, [queryClient, ref.fileId, ref.name]);

  return useSuspenseQuery({
    queryKey,
    queryFn: async (): Promise<LoadedSpec> => {
      const filePromise = resolvePipelineFile(ref, storage);

      const [specData, undoHistory] = await Promise.all([
        filePromise.then(async (file) => {
          loadedStorageKey.current = file.storageKey;
          return yaml.load(await file.read(), PIPELINE_YAML_LOAD_OPTIONS);
        }),
        loadUndoHistory(ref.name).catch(() => null),
      ]);

      const loadedSpec = deserializeSpecData(specData, undoHistory);
      await hydrateLoadedSpecRefs(loadedSpec.spec);

      return loadedSpec;
    },
    staleTime: Infinity,
    retry: false,
  });
}

function deserializeSpecData(
  specData: unknown,
  undoHistory: Awaited<ReturnType<typeof loadUndoHistory>> | null,
): LoadedSpec {
  if (undoHistory) {
    try {
      const replayIdGen = new ReplayIdGenerator(undoHistory.idStack);
      const spec = deserializeSpec(specData, replayIdGen);
      const restoredUndoStore = createUndoStoreWithEvents(
        undoHistory.undoEvents,
      );
      return { spec, restoredUndoStore };
    } catch (error) {
      console.warn("Failed to restore undo history, loading fresh:", error);
    }
  }

  return { spec: deserializeSpec(specData) };
}
