import {
  generateDigest,
  parseComponentData,
} from "@/services/componentService";
import type {
  ComponentData,
  ComponentFolder,
  ComponentLibrary,
} from "@/types/componentLibrary";

import type { ComponentReference, GraphSpec, TaskSpec } from "./componentSpec";
import { getAllComponentFilesFromList } from "./componentStore";
import { USER_COMPONENTS_LIST_NAME } from "./constants";
import { getComponentByUrl } from "./localforge";

export const fetchUserComponents = async (): Promise<ComponentFolder> => {
  try {
    const componentFiles = await getAllComponentFilesFromList(
      USER_COMPONENTS_LIST_NAME,
    );

    const components: ComponentReference[] = [];

    Array.from(componentFiles.entries()).forEach(([_, fileEntry]) => {
      components.push({
        ...fileEntry.componentRef,
        name: fileEntry.name,
      });
    });

    const userComponentsFolder: ComponentFolder = {
      name: "User Components",
      components,
      folders: [],
      isUserFolder: true, // Add a flag to identify this as user components folder
    };

    return userComponentsFolder;
  } catch (error) {
    console.error("Error fetching user components:", error);
    return {
      name: "User Components",
      components: [],
      folders: [],
      isUserFolder: true,
    };
  }
};

export const fetchUsedComponents = (graphSpec: GraphSpec): ComponentFolder => {
  if (!graphSpec || !graphSpec.tasks || typeof graphSpec.tasks !== "object") {
    return {
      name: "Used in Pipeline",
      components: [],
      folders: [],
      isUserFolder: false,
    };
  }

  const usedComponentsMap = new Map<string, ComponentReference>();

  Object.values(graphSpec.tasks).forEach((task: TaskSpec) => {
    const key = task.componentRef.digest;
    if (key && !usedComponentsMap.has(key)) {
      usedComponentsMap.set(key, {
        ...task.componentRef,
      });
    }
  });

  return {
    name: "Used in Pipeline",
    components: Array.from(usedComponentsMap.values()),
    folders: [],
    isUserFolder: false,
  };
};

export async function populateComponentRefsFromUrls<
  T extends ComponentLibrary | ComponentFolder,
>(libraryOrFolder: T): Promise<T> {
  async function populateRef(
    ref: ComponentReference,
  ): Promise<ComponentReference> {
    if ((!ref.spec || !ref.digest || !ref.text) && ref.url) {
      const stored = await getComponentByUrl(ref.url);
      if (stored && stored.data) {
        const parsed = parseComponentData(stored.data);
        const digest = await generateDigest(stored.data);
        return {
          ...ref,
          spec: parsed || ref.spec,
          digest: digest || ref.digest,
          text: stored.data,
        };
      }
    }
    return ref;
  }

  // Process components at this level
  const updatedComponents =
    "components" in libraryOrFolder && Array.isArray(libraryOrFolder.components)
      ? await Promise.all(libraryOrFolder.components.map(populateRef))
      : [];

  // Recurse into folders
  const updatedFolders =
    "folders" in libraryOrFolder && Array.isArray(libraryOrFolder.folders)
      ? await Promise.all(
          libraryOrFolder.folders.map((folder) =>
            populateComponentRefsFromUrls(folder),
          ),
        )
      : [];

  return {
    ...libraryOrFolder,
    ...(updatedComponents.length ? { components: updatedComponents } : {}),
    ...(updatedFolders.length ? { folders: updatedFolders } : {}),
  } as T;
}

export function flattenFolders(
  folder: ComponentFolder | ComponentLibrary,
): ComponentReference[] {
  let components: ComponentReference[] = [];
  if ("components" in folder && folder.components)
    components = components.concat(folder.components);
  if (folder.folders) {
    folder.folders.forEach((f) => {
      components = components.concat(flattenFolders(f));
    });
  }
  return components;
}

export function componentReferenceToComponentData(
  componentRef: ComponentReference,
): ComponentData | null {
  if (!componentRef || !componentRef.spec) return null;

  const digest = componentRef.digest;

  if (!digest) {
    console.error(
      `Component reference: ${componentRef.name}, does not have a valid digest. Cannot convert to ComponentData.`,
    );
    return null;
  }

  return {
    digest,
    url: componentRef.url || "",
    data: {
      ...componentRef.spec,
      name: componentRef.spec.name || componentRef.name || "Unnamed Component",
    },
  };
}

export const filterToUniqueByDigest = (components: ComponentReference[]) => {
  const seenDigests = new Set<string>();
  return components.filter((c) => {
    if (!c.digest) return true;
    if (seenDigests.has(c.digest)) return false;
    seenDigests.add(c.digest);
    return true;
  });
};
