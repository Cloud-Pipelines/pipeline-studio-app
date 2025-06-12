/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import yaml from "js-yaml";
import localForage from "localforage";

import type { DownloadDataType } from "./cache";
import { downloadDataWithCache } from "./cache";
import type { ComponentReference, ComponentSpec } from "./componentSpec";
import { isValidComponentSpec } from "./componentSpec";
import { getIdOrTitleFromPath } from "./URL";

// IndexedDB: DB and table names
const DB_NAME = "components";
const DIGEST_TO_DATA_DB_TABLE_NAME = "digest_to_component_data";
const DIGEST_TO_COMPONENT_SPEC_DB_TABLE_NAME = "digest_to_component_spec";
const DIGEST_TO_COMPONENT_NAME_DB_TABLE_NAME = "digest_to_component_name";
const URL_TO_DIGEST_DB_TABLE_NAME = "url_to_digest";
const DIGEST_TO_CANONICAL_URL_DB_TABLE_NAME = "digest_to_canonical_url";
const COMPONENT_REF_LISTS_DB_TABLE_NAME = "component_ref_lists";
const COMPONENT_STORE_SETTINGS_DB_TABLE_NAME = "component_store_settings";
const FILE_STORE_DB_TABLE_NAME_PREFIX = "file_store_";

export interface ComponentReferenceWithSpec extends ComponentReference {
  spec: ComponentSpec;
  digest: string;
  // If ComponentReference has digest it probably should have text as well
  text: string;
}

export interface ComponentReferenceWithSpecPlusData {
  componentRef: ComponentReferenceWithSpec;
  data: ArrayBuffer;
}

const calculateHashDigestHex = async (data: string | ArrayBuffer) => {
  const dataBytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

const storeComponentSpec = async (
  digest: string,
  componentSpec: ComponentSpec,
) => {
  const digestToComponentSpecDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_COMPONENT_SPEC_DB_TABLE_NAME,
  });
  const digestToComponentNameDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_COMPONENT_NAME_DB_TABLE_NAME,
  });
  await digestToComponentSpecDb.setItem(digest, componentSpec);
  if (componentSpec.name !== undefined) {
    await digestToComponentNameDb.setItem(digest, componentSpec.name);
  }
};

export const loadComponentAsRefFromText = async (
  componentText: string | ArrayBuffer,
): Promise<ComponentReferenceWithSpec> => {
  const componentString =
    typeof componentText === "string"
      ? componentText
      : new TextDecoder().decode(componentText);
  const componentBytes =
    typeof componentText === "string"
      ? new TextEncoder().encode(componentText)
      : componentText;

  const loadedObj = yaml.load(componentString);
  if (typeof loadedObj !== "object" || loadedObj === null) {
    throw Error(`componentText is not a YAML-encoded object: ${loadedObj}`);
  }
  if (!isValidComponentSpec(loadedObj)) {
    throw Error(
      `componentText does not encode a valid pipeline component: ${loadedObj}`,
    );
  }
  const componentSpec: ComponentSpec = loadedObj;

  const digest = await calculateHashDigestHex(componentBytes);
  const componentRef: ComponentReferenceWithSpec = {
    spec: componentSpec,
    digest: digest,
    text: componentString,
  };
  return componentRef;
};

export const loadComponentFromUrlAsRef = async (
  url: string,
  downloadData: DownloadDataType = downloadDataWithCache,
): Promise<ComponentReferenceWithSpec> => {
  const componentRef = await downloadData(url, loadComponentAsRefFromText);
  componentRef.url = url;
  return componentRef;
};

export const preloadComponentReferences = async (
  componentSpec: ComponentSpec,
  downloadData: DownloadDataType = downloadDataWithCache,
  componentMap?: Map<string, ComponentSpec>,
) => {
  // This map is needed to improve efficiency and handle recursive components.
  if (componentMap === undefined) {
    componentMap = new Map<string, ComponentSpec>();
  }
  if ("graph" in componentSpec.implementation) {
    for (const taskSpec of Object.values(
      componentSpec.implementation.graph.tasks,
    )) {
      const componentUrl = taskSpec.componentRef.url;
      let taskComponentSpec = taskSpec.componentRef.spec;

      if (taskComponentSpec === undefined) {
        if (taskSpec.componentRef.text !== undefined) {
          const taskComponentRef = await loadComponentAsRefFromText(
            taskSpec.componentRef.text,
          );
          taskComponentSpec = taskComponentRef.spec;
        } else if (componentUrl !== undefined) {
          taskComponentSpec = componentMap.get(componentUrl);

          if (taskComponentSpec === undefined) {
            const taskComponentRef = await loadComponentFromUrlAsRef(
              componentUrl,
              downloadData,
            );
            taskComponentSpec = taskComponentRef.spec;
            componentMap.set(componentUrl, taskComponentSpec);
          }
        }

        if (taskComponentSpec === undefined) {
          // TODO: Print task name here
          console.error(
            "Could not get component spec for task: ",
            taskSpec.componentRef,
          );
        } else {
          taskSpec.componentRef.spec = taskComponentSpec;
          await preloadComponentReferences(
            taskSpec.componentRef.spec,
            downloadData,
            componentMap,
          );
        }
      }
    }
  }
  return componentSpec;
};

export const fullyLoadComponentRefFromUrl = async (
  url: string,
  downloadData: DownloadDataType = downloadDataWithCache,
): Promise<ComponentReferenceWithSpec> => {
  const componentRef = await loadComponentFromUrlAsRef(url, downloadData);
  const componentSpec = await preloadComponentReferences(
    componentRef.spec,
    downloadData,
  );
  const newComponentRef: ComponentReferenceWithSpec = {
    ...componentRef,
    spec: componentSpec,
  };
  return newComponentRef;
};

export const fullyLoadComponentRef = async (
  componentRef: ComponentReference,
  downloadData: DownloadDataType = downloadDataWithCache,
  recursive: boolean = true,
): Promise<ComponentReferenceWithSpec> => {
  let newComponentRef: ComponentReferenceWithSpec;
  if (componentRef.spec === undefined) {
    if (componentRef.text !== undefined) {
      const loadedComponentRef = await loadComponentAsRefFromText(
        componentRef.text,
      );
      newComponentRef = {
        ...componentRef,
        spec: loadedComponentRef.spec,
        digest: loadedComponentRef.digest,
        text: loadedComponentRef.text,
      };
    } else {
      if (componentRef.url !== undefined) {
        const loadedComponentRef = await loadComponentFromUrlAsRef(
          componentRef.url,
          downloadData,
        );
        newComponentRef = {
          ...componentRef,
          spec: loadedComponentRef.spec,
          digest: loadedComponentRef.digest,
          text: loadedComponentRef.text,
        };
      } else {
        throw Error(
          `The component reference cannot be materialized since it has no information: ${componentRef}`,
        );
      }
    }
  } else {
    console.warn("Regenerating component text from spec. Avoid this.");
    const componentText = componentSpecToYaml(componentRef.spec);
    const componentDigest = await calculateHashDigestHex(componentText);
    newComponentRef = {
      ...componentRef,
      spec: componentRef.spec,
      digest: componentDigest,
      text: componentText,
    };
  }
  if (recursive) {
    preloadComponentReferences(newComponentRef.spec, downloadData);
  }
  return newComponentRef;
};

export const storeComponentText = async (
  componentText: string | ArrayBuffer,
) => {
  const componentBytes =
    typeof componentText === "string"
      ? new TextEncoder().encode(componentText)
      : componentText;
  const componentRef = await loadComponentAsRefFromText(componentText);
  const digestToComponentTextDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_DATA_DB_TABLE_NAME,
  });
  await digestToComponentTextDb.setItem(componentRef.digest, componentBytes);
  await storeComponentSpec(componentRef.digest, componentRef.spec);

  return componentRef;
};

export const getAllComponentsAsRefs = async () => {
  const digestToDataDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_DATA_DB_TABLE_NAME,
  });

  // TODO: Rewrite as async generator
  const digestToComponentData = new Map<string, ArrayBuffer>();
  await digestToDataDb.iterate<ArrayBuffer, void>((data, digest) => {
    digestToComponentData.set(digest, data);
  });

  const digestToComponentRef = new Map<string, ComponentReferenceWithSpec>(
    await Promise.all(
      Array.from(digestToComponentData.entries()).map(
        async ([digest, data]) =>
          [digest, await loadComponentAsRefFromText(data)] as const,
      ),
    ),
  );

  await addCanonicalUrlsToComponentReferences(digestToComponentRef);

  const componentRefs = Array.from(digestToComponentRef.values());
  return componentRefs;
};

const addCanonicalUrlsToComponentReferences = async (
  digestToComponentRef: Map<string, ComponentReference>,
) => {
  const digestToCanonicalUrlDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_CANONICAL_URL_DB_TABLE_NAME,
  });
  await digestToCanonicalUrlDb.iterate<string, void>((url, digest) => {
    const componentRef = digestToComponentRef.get(digest);
    if (componentRef === undefined) {
      console.error(
        `Component db corrupted: Component with url ${url} and digest ${digest} has no content in the DB.`,
      );
    } else {
      componentRef.url = url;
    }
  });
};

export const searchComponentsByName = async (name: string) => {
  const componentRefs = await getAllComponentsAsRefs();
  return componentRefs.filter(
    (ref) => ref.spec.name?.toLowerCase().includes(name.toLowerCase()) ?? false,
  );
};

export const storeComponentFromUrl = async (
  url: string,
  setUrlAsCanonical = false,
): Promise<ComponentReferenceWithSpec> => {
  const urlToDigestDb = localForage.createInstance({
    name: DB_NAME,
    storeName: URL_TO_DIGEST_DB_TABLE_NAME,
  });
  const digestToComponentSpecDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_COMPONENT_SPEC_DB_TABLE_NAME,
  });
  const digestToDataDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_DATA_DB_TABLE_NAME,
  });

  const existingDigest = await urlToDigestDb.getItem<string>(url);
  if (existingDigest !== null) {
    const componentSpec =
      await digestToComponentSpecDb.getItem<ComponentSpec>(existingDigest);
    const componentData =
      await digestToDataDb.getItem<ArrayBuffer>(existingDigest);
    if (componentSpec !== null && componentData !== null) {
      const componentRef: ComponentReferenceWithSpec = {
        url: url,
        digest: existingDigest,
        spec: componentSpec,
        text: new TextDecoder().decode(componentData),
      };
      return componentRef;
    } else {
      console.error(
        `Component db is corrupted: Component with url ${url} was added before with digest ${existingDigest} but now has no content in the DB.`,
      );
    }
  }

  // TODO: Think about whether to directly use fetch here.
  const response = await fetch(url);
  const componentData = await response.arrayBuffer();
  const componentRef = await storeComponentText(componentData);
  componentRef.url = url;
  const digest = componentRef.digest;
  if (digest === undefined) {
    console.error(
      `Cannot happen: storeComponentText has returned componentReference with digest === undefined.`,
    );
    return componentRef;
  }
  if (existingDigest !== null && digest !== existingDigest) {
    console.error(
      `Component db is corrupted: Component with url ${url} previously had digest ${existingDigest} but now has digest ${digest}.`,
    );
  }
  const digestToCanonicalUrlDb = localForage.createInstance({
    name: DB_NAME,
    storeName: DIGEST_TO_CANONICAL_URL_DB_TABLE_NAME,
  });
  const existingCanonicalUrl =
    await digestToCanonicalUrlDb.getItem<string>(digest);
  if (existingCanonicalUrl === null) {
    await digestToCanonicalUrlDb.setItem(digest, url);
  } else {
    if (url !== existingCanonicalUrl) {
      console.debug(
        `The component with digest "${digest}" is being loaded from "${url}", but was previously loaded from "${existingCanonicalUrl}".` +
          (setUrlAsCanonical ? " Changing the canonical url." : ""),
      );
      if (setUrlAsCanonical) {
        await digestToCanonicalUrlDb.setItem(digest, url);
      }
    }
  }
  // Updating the urlToDigestDb last, because it's used to check for cached entries.
  // So we need to be sure that everything has been updated correctly.
  await urlToDigestDb.setItem(url, digest);
  return componentRef;
};

interface ComponentFileEntryV2 {
  componentRef: ComponentReferenceWithSpec;
}

interface FileEntry {
  name: string;
  creationTime: Date;
  modificationTime: Date;
  data: ArrayBuffer;
}

interface ComponentFileEntryV3
  extends FileEntry,
    ComponentReferenceWithSpecPlusData {}

export type ComponentFileEntry = ComponentFileEntryV3;

const makeNameUniqueByAddingIndex = (
  name: string,
  existingNames: Set<string>,
): string => {
  let finalName = name;
  let index = 1;
  while (existingNames.has(finalName)) {
    index++;
    finalName = name + " " + index.toString();
  }
  return finalName;
};

const writeComponentRefToFile = async (
  listName: string,
  fileName: string,
  componentRef: ComponentReferenceWithSpec,
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  const existingFile =
    await componentListDb.getItem<ComponentFileEntry>(fileName);
  const currentTime = new Date();
  const componentData = new TextEncoder().encode(componentRef.text);
  let fileEntry: ComponentFileEntry;
  if (existingFile === null) {
    fileEntry = {
      componentRef: componentRef,
      name: fileName,
      creationTime: currentTime,
      modificationTime: currentTime,
      data: componentData,
    };
  } else {
    fileEntry = {
      ...existingFile,
      name: fileName,
      modificationTime: currentTime,
      data: componentData,
      componentRef: componentRef,
    };
  }
  await componentListDb.setItem(fileName, fileEntry);
  return fileEntry;
};

export const updateComponentRefInList = async (
  listName: string,
  componentRef: ComponentReferenceWithSpec,
  fileName: string,
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  const existingFile =
    await componentListDb.getItem<ComponentFileEntry>(fileName);
  if (existingFile === null) {
    throw new Error(
      `Cannot update component "${fileName}" in list "${listName}" because it does not exist.`,
    );
  }
  return writeComponentRefToFile(listName, fileName, componentRef);
};

const addComponentRefToList = async (
  listName: string,
  componentRef: ComponentReferenceWithSpec,
  fileName: string = "Component",
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  const existingNames = new Set<string>(await componentListDb.keys());
  const uniqueFileName = makeNameUniqueByAddingIndex(fileName, existingNames);
  return writeComponentRefToFile(listName, uniqueFileName, componentRef);
};

export const addComponentToListByUrl = async (
  listName: string,
  url: string,
  defaultFileName: string = "Component",
  additionalData?: {
    [K: string]: any;
  },
) => {
  const componentRef = await storeComponentFromUrl(url);

  if (additionalData) {
    // Merge additional data into the component reference
    Object.assign(componentRef, additionalData);
  }

  return addComponentRefToList(
    listName,
    componentRef,
    componentRef.spec.name ?? defaultFileName,
  );
};

/**
 * Checks if a component with the same name and content already exists in the list
 * @param listName - The component list name (e.g., USER_COMPONENTS_LIST_NAME)
 * @param componentRef - The component reference to check for duplicates
 * @returns The existing file entry if a duplicate is found, null otherwise
 */
export const findDuplicateComponent = async (
  listName: string,
  componentRef: ComponentReferenceWithSpec,
): Promise<ComponentFileEntry | null> => {
  try {
    const componentFiles = await getAllComponentFilesFromList(listName);
    const targetComponentName = componentRef.spec.name;

    if (!targetComponentName) {
      return null; // Can't check for duplicates without a name
    }

    // Look for components with the same name
    for (const [, fileEntry] of componentFiles) {
      const existingComponentName = fileEntry.componentRef.spec.name;

      if (existingComponentName === targetComponentName) {
        // Found a component with the same name, now check if content is identical
        if (fileEntry.componentRef.text === componentRef.text) {
          return fileEntry; // Exact duplicate found
        }
      }
    }

    return null; // No duplicate found
  } catch (error) {
    console.error("Error checking for duplicate component:", error);
    return null;
  }
};

/**
 * Enhanced version of addComponentToListByText that checks for duplicates
 * @param listName - The component list name
 * @param componentText - The component YAML text
 * @param fileName - Optional specific file name
 * @param defaultFileName - Default file name if none provided
 * @param allowDuplicates - Whether to allow duplicate imports (default: false)
 * @returns Object with the file entry and a flag indicating if it was a duplicate
 */
export const addComponentToListByTextWithDuplicateCheck = async (
  listName: string,
  componentText: string | ArrayBuffer,
  fileName?: string,
  defaultFileName: string = "Component",
  allowDuplicates: boolean = false,
  additionalData?: {
    [K: string]: any;
  },
): Promise<ComponentFileEntry> => {
  const componentRef = await storeComponentText(componentText);

  if (additionalData) {
    // Merge additional data into the component reference
    Object.assign(componentRef, additionalData);
  }

  if (!allowDuplicates) {
    const existingComponent = await findDuplicateComponent(
      listName,
      componentRef,
    );
    if (existingComponent) {
      return updateComponentRefInList(
        listName,
        componentRef,
        existingComponent.name,
      );
    }
  }

  // No duplicate found or duplicates are allowed, proceed with normal addition
  const fileEntry = await addComponentRefToList(
    listName,
    componentRef,
    fileName ?? componentRef.spec.name ?? defaultFileName,
  );

  return fileEntry;
};

// Keep the original function for backward compatibility
export const addComponentToListByText = async (
  listName: string,
  componentText: string | ArrayBuffer,
  fileName?: string,
  defaultFileName: string = "Component",
) => {
  const componentRef = await storeComponentText(componentText);
  return addComponentRefToList(
    listName,
    componentRef,
    fileName ?? componentRef.spec.name ?? defaultFileName,
  );
};

export const updateComponentInListByText = async (
  listName: string,
  componentText: string | ArrayBuffer,
  fileName: string,
  additionalData?: {
    [K: string]: any;
  },
) => {
  const componentRef = await storeComponentText(componentText);
  if (additionalData) {
    // Merge additional data into the component reference
    Object.assign(componentRef, additionalData);
  }
  return updateComponentRefInList(listName, componentRef, fileName);
};

export const writeComponentToFileListFromText = async (
  listName: string,
  fileName: string,
  componentText: string | ArrayBuffer,
) => {
  const componentRef = await storeComponentText(componentText);
  return writeComponentRefToFile(listName, fileName, componentRef);
};

export const renameComponentFileInList = async (
  listName: string,
  oldFileName: string,
  newFileName: string,
  pathname?: string,
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });

  // Check if the old file exists
  let fileEntry =
    await componentListDb.getItem<ComponentFileEntry>(oldFileName);
  if (!fileEntry) {
    // If the old file does not exist and a pathanme is provided, check the url for a filename
    if (pathname) {
      const { idOrTitle } = getIdOrTitleFromPath(pathname);
      if (idOrTitle) {
        fileEntry =
          await componentListDb.getItem<ComponentFileEntry>(idOrTitle);
      }
      if (!fileEntry) {
        throw new Error(
          `Backup file "${idOrTitle}" does not exist in list "${listName}".`,
        );
      }
    } else {
      throw new Error(
        `File "${oldFileName}" does not exist in list "${listName}".`,
      );
    }
  }

  // Check if the new file name is already taken
  const existingNewFile =
    await componentListDb.getItem<ComponentFileEntry>(newFileName);
  if (existingNewFile) {
    throw new Error(
      `File "${newFileName}" already exists in list "${listName}".`,
    );
  }

  fileEntry.componentRef.spec.name = newFileName;

  // Update the file entry's name
  const updatedFileEntry = { ...fileEntry, name: newFileName };

  // Remove the old entry and add the new one
  await componentListDb.removeItem(oldFileName);
  await componentListDb.setItem(newFileName, updatedFileEntry);

  return updatedFileEntry;
};

export const getAllComponentsFromList = async (listName: string) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  const componentRefs: ComponentReferenceWithSpec[] = [];
  await componentListDb.iterate<ComponentFileEntry, void>((fileEntry) => {
    componentRefs.push(fileEntry.componentRef);
  });
  return componentRefs;
};

export const getAllComponentFilesFromList = async (listName: string) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  const componentFiles = new Map<string, ComponentFileEntry>();
  await componentListDb.iterate<ComponentFileEntry, void>(
    (fileEntry, fileName) => {
      componentFiles.set(fileName, fileEntry);
    },
  );
  return componentFiles;
};

export const getComponentFileFromList = async (
  listName: string,
  fileName: string,
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  return componentListDb.getItem<ComponentFileEntry>(fileName);
};

export const deleteComponentFileFromList = async (
  listName: string,
  fileName: string,
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  return componentListDb.removeItem(fileName);
};

export const unsafeWriteFilesToList = async (
  listName: string,
  files: ComponentFileEntry[],
) => {
  await upgradeSingleComponentListDb(listName);
  const tableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: tableName,
  });
  for (const file of files) {
    await componentListDb.setItem(file.name, file);
  }
};

export const componentSpecToYaml = (componentSpec: ComponentSpec) => {
  return yaml.dump(componentSpec, { lineWidth: 10000 });
};

// TODO: Remove the upgrade code in several weeks.
const upgradeSingleComponentListDb = async (listName: string) => {
  const componentListVersionKey = "component_list_format_version_" + listName;
  const componentStoreSettingsDb = localForage.createInstance({
    name: DB_NAME,
    storeName: COMPONENT_STORE_SETTINGS_DB_TABLE_NAME,
  });
  const componentListTableName = FILE_STORE_DB_TABLE_NAME_PREFIX + listName;
  const componentListDb = localForage.createInstance({
    name: DB_NAME,
    storeName: componentListTableName,
  });
  let listFormatVersion =
    (await componentStoreSettingsDb.getItem<number>(componentListVersionKey)) ??
    1;
  if (![1, 2, 3, 4].includes(listFormatVersion)) {
    throw Error(
      `upgradeComponentListDb: Unknown component list version "${listFormatVersion}" for the list ${listName}`,
    );
  }
  if (listFormatVersion === 1) {
    console.log(`componentStore: Upgrading the component list DB ${listName}`);
    const componentRefListsDb = localForage.createInstance({
      name: DB_NAME,
      storeName: COMPONENT_REF_LISTS_DB_TABLE_NAME,
    });
    const componentRefList: ComponentReferenceWithSpec[] =
      (await componentRefListsDb.getItem(listName)) ?? [];

    const existingNames = new Set<string>();
    const emptyNameReplacement =
      listName === "user_pipelines" ? "Pipeline" : "Component";
    for (const componentRef of componentRefList) {
      const fileName = componentRef.spec.name ?? emptyNameReplacement;
      const uniqueFileName = makeNameUniqueByAddingIndex(
        fileName,
        existingNames,
      );
      const fileEntry: ComponentFileEntryV2 = {
        componentRef: componentRef,
      };
      await componentListDb.setItem(uniqueFileName, fileEntry);
      existingNames.add(uniqueFileName);
    }
    await componentStoreSettingsDb.setItem(componentListVersionKey, 2);
    listFormatVersion = 2;
    console.log(
      `componentStore: Upgraded the component list DB ${listName} to version ${listFormatVersion}`,
    );
  }
  if (listFormatVersion === 2) {
    const digestToDataDb = localForage.createInstance({
      name: DB_NAME,
      storeName: DIGEST_TO_DATA_DB_TABLE_NAME,
    });
    const fileNames = await componentListDb.keys();
    for (const fileName of fileNames) {
      const fileEntry =
        await componentListDb.getItem<ComponentFileEntryV2>(fileName);
      if (fileEntry === null) {
        throw Error(`File "${fileName}" has disappeared during upgrade`);
      }
      const componentRef = fileEntry.componentRef;
      let data = await digestToDataDb.getItem<ArrayBuffer>(
        fileEntry.componentRef.digest,
      );
      if (data === null) {
        console.error(
          `Db is corrupted: Could not find data for file "${fileName}" with digest ${fileEntry.componentRef.digest}.`,
        );
        const componentText = componentSpecToYaml(fileEntry.componentRef.spec);
        data = new TextEncoder().encode(componentText);
        const newDigest = await calculateHashDigestHex(data);
        componentRef.digest = newDigest;
        console.warn(
          `The component "${fileName}" was re-serialized. Old digest: ${fileEntry.componentRef.digest}. New digest ${newDigest}.`,
        );
        // This case should not happen. Let's throw error for now.
        throw Error(
          `Db is corrupted: Could not find data for file "${fileName}" with digest ${fileEntry.componentRef.digest}.`,
        );
      }
      const currentTime = new Date();
      const newFileEntry: ComponentFileEntryV3 = {
        name: fileName,
        creationTime: currentTime,
        modificationTime: currentTime,
        data: data,
        componentRef: componentRef,
      };
      await componentListDb.setItem(fileName, newFileEntry);
    }
    listFormatVersion = 3;
    await componentStoreSettingsDb.setItem(
      componentListVersionKey,
      listFormatVersion,
    );
    console.log(
      `componentStore: Upgraded the component list DB ${listName} to version ${listFormatVersion}`,
    );
  }
  if (listFormatVersion === 3) {
    // Upgrading the DB to backfill entry.componentRef.text from entry.data
    const fileNames = await componentListDb.keys();
    for (const fileName of fileNames) {
      const fileEntry =
        await componentListDb.getItem<ComponentFileEntryV3>(fileName);
      if (fileEntry === null) {
        throw Error(`File "${fileName}" has disappeared during upgrade`);
      }
      if (!fileEntry.componentRef.text) {
        fileEntry.componentRef.text = new TextDecoder().decode(fileEntry.data);
      }
      await componentListDb.setItem(fileName, fileEntry);
    }
    listFormatVersion = 4;
    await componentStoreSettingsDb.setItem(
      componentListVersionKey,
      listFormatVersion,
    );
    console.log(
      `componentStore: Upgraded the component list DB ${listName} to version ${listFormatVersion}`,
    );
  }
};
