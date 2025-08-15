import yaml from "js-yaml";

import { COMPONENT_LIBRARY_FILE } from "@/appSettings";
import {
  type ComponentFolder,
  type ComponentLibrary,
  isValidComponentLibrary,
} from "@/types/componentLibrary";
import { loadObjectFromYamlData } from "@/utils/cache";
import type {
  ComponentReference,
  ComponentSpec,
  InputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import {
  componentExistsByUrl,
  getAllUserComponents,
  getComponentById,
  getComponentByUrl,
  saveComponent,
  type UserComponent,
} from "@/utils/localforage";

export interface ExistingAndNewComponent {
  existingComponent: UserComponent | undefined;
  newComponent: ComponentSpec | undefined;
}

const COMPONENT_LIBRARY_URL = "/" + COMPONENT_LIBRARY_FILE;

/**
 * Generate a digest for a component
 */
export const generateDigest = async (text: string): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Fetches the component library from local storage
 */
const loadComponentLibraryFromLocalStorage =
  async (): Promise<ComponentLibrary | null> => {
    const libraryExists = await componentExistsByUrl(COMPONENT_LIBRARY_URL);

    if (libraryExists) {
      const storedLibrary = await getComponentByUrl(COMPONENT_LIBRARY_URL);
      if (storedLibrary) {
        try {
          const parsedLibrary = JSON.parse(storedLibrary.data);
          if (isValidComponentLibrary(parsedLibrary)) {
            return parsedLibrary;
          }
        } catch (error) {
          console.error("Error parsing stored component library:", error);
        }
      }
    }

    return null;
  };

/**
 * Fetches the component library and stores all components in local storage
 */
export const fetchAndStoreComponentLibrary =
  async (): Promise<ComponentLibrary> => {
    // Try fetch from the URL
    const response = await fetch(COMPONENT_LIBRARY_URL);
    if (!response.ok) {
      // Fallback to local storage
      await loadComponentLibraryFromLocalStorage().then((library) => {
        if (library) {
          return library;
        }
      });

      throw new Error(
        `Failed to load component library: ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const obj = loadObjectFromYamlData(arrayBuffer);

    if (!isValidComponentLibrary(obj)) {
      // Fallback to local storage
      await loadComponentLibraryFromLocalStorage().then((library) => {
        if (library) {
          return library;
        }
      });

      throw new Error("Invalid component library structure");
    }

    // Store the fetched library in local storage
    await saveComponent({
      id: `library-${Date.now()}`,
      url: COMPONENT_LIBRARY_URL,
      data: JSON.stringify(obj),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Also store individual components for future reference
    await storeComponentsFromLibrary(obj);

    return obj;
  };

/**
 * Store all components from the library in local storage
 */
const storeComponentsFromLibrary = async (
  library: ComponentLibrary,
): Promise<void> => {
  const processFolder = async (folder: ComponentFolder) => {
    // Store each component in the folder
    for (const component of folder.components || []) {
      await fetchAndStoreComponent(component);
    }

    // Process subfolders recursively
    for (const subfolder of folder.folders || []) {
      await processFolder(subfolder);
    }
  };

  // Process all top-level folders
  for (const folder of library.folders) {
    await processFolder(folder);
  }
};

/**
 * Fetch and store a single component by URL
 */
export const fetchAndStoreComponentByUrl = async (
  url: string,
): Promise<ComponentSpec | null> => {
  try {
    // Check if component already exists in storage
    const exists = await componentExistsByUrl(url);
    if (exists) {
      const text = await fetchComponentTextFromUrl(url);
      if (text) {
        try {
          return yaml.load(text) as ComponentSpec;
        } catch (error) {
          console.error(`Error parsing component at ${url}:`, error);
        }
      }
    }

    // If not in storage or parsing failed, fetch from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch component: ${response.statusText}`);
    }

    const text = await response.text();
    const digest = await generateDigest(text);

    const id = `component-${digest}`;
    const createdAt = Date.now();
    const updatedAt = Date.now();

    await saveComponent({
      id,
      url,
      data: text,
      createdAt,
      updatedAt,
    });

    try {
      return yaml.load(text) as ComponentSpec;
    } catch (error) {
      console.error(`Error parsing component at ${url}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching component at ${url}:`, error);
    return null;
  }
};

/**
 * Fetch and store a single component by text, URL or spec (in that order).
 * Returns the populated ComponentSpec or null.
 */
export const fetchAndStoreComponent = async (
  component: ComponentReference,
): Promise<ComponentSpec | null> => {
  try {
    const text = await getComponentText(component);
    const spec = await parseTextToSpec(component, text);

    if (text) {
      const digest = await generateDigest(text);

      const id = `component-${digest}`;
      const createdAt = Date.now();
      const updatedAt = Date.now();

      const existingComponent = await getComponentById(id);

      if (!existingComponent || text !== existingComponent.data) {
        await saveComponent({
          // preserve existing state
          ...(existingComponent ?? {}),
          id,
          url: component.url ?? "",
          data: text,
          createdAt: existingComponent?.createdAt ?? createdAt,
          updatedAt,
        });
      }
    }

    return spec;
  } catch (error) {
    console.error(`Error in fetchAndStoreComponent:`, error);
    return null;
  }
};

/**
 * Get component text from any available source (text, URL, or spec)
 */
const getComponentText = async (
  component: ComponentReference,
): Promise<string | undefined> => {
  if (component.text) {
    return component.text;
  }

  if (component.url) {
    return await fetchComponentTextFromUrl(component.url);
  }

  if (component.spec) {
    return yaml.dump(component.spec);
  }

  return undefined;
};

/**
 * Parse text content into ComponentSpec, with fallback to existing spec
 */
const parseTextToSpec = async (
  component: ComponentReference,
  text: string | undefined,
): Promise<ComponentSpec | null> => {
  if (text) {
    try {
      return yaml.load(text) as ComponentSpec;
    } catch (error) {
      console.error("Error parsing component text:", error);
    }
  }

  if (component.spec) {
    return component.spec;
  }

  return null;
};

/**
 * Helper function to fetch text content from URL (with caching)
 */
const fetchComponentTextFromUrl = async (
  url: string,
): Promise<string | undefined> => {
  // Check cache first
  const storedComponent = await getComponentByUrl(url);
  if (storedComponent) {
    return storedComponent.data;
  }

  // Fetch from network
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch component: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching component from URL ${url}:`, error);
    return undefined;
  }
};

/**
 * Parse a component's data into a ComponentSpec
 */
export const parseComponentData = (data: string): ComponentSpec | null => {
  try {
    return yaml.load(data) as ComponentSpec;
  } catch (error) {
    console.error("Error parsing component data:", error);
    return null;
  }
};

export const getExistingAndNewUserComponent = async (
  componentData: string | ArrayBuffer,
): Promise<ExistingAndNewComponent> => {
  const allUserComponents = await getAllUserComponents();

  const newDigest = await generateDigest(componentData as string);
  const component = parseComponentData(componentData as string);
  const existingComponent = allUserComponents.find((userComponent) => {
    const existingDigest = userComponent.componentRef.digest;

    return (
      existingDigest !== newDigest && userComponent?.name === component?.name
    );
  });
  if (!existingComponent || !component) {
    return {
      existingComponent: undefined,
      newComponent: component ?? undefined,
    };
  }
  return {
    existingComponent,
    newComponent: component,
  };
};

export const inputsWithInvalidArguments = (
  inputs: InputSpec[] | undefined,
  taskSpec: TaskSpec | undefined,
) => {
  if (!inputs || !taskSpec) {
    return [];
  }

  return inputs
    .filter((input) => {
      const isOptional = input.optional;
      const hasDefault = input.default;
      const isDefinedInArguments = input.name in (taskSpec.arguments ?? {});
      return !isOptional && !hasDefault && !isDefinedInArguments;
    })
    .map((input) => input.name);
};
