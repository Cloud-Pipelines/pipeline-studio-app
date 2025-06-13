import yaml from "js-yaml";

import {
  type ComponentFolder,
  type ComponentLibrary,
  isValidComponentLibrary,
} from "@/types/componentLibrary";
import { loadObjectFromYamlData } from "@/utils/cache";
import type { ComponentSpec, InputSpec, TaskSpec } from "@/utils/componentSpec";
import {
  type Component,
  componentExistsByUrl,
  getAllComponents,
  getAllUserComponents,
  getComponentByUrl,
  saveComponent,
  type UserComponent,
} from "@/utils/localforge";

const COMPONENT_LIBRARY_URL = "/component_library.yaml";

export interface ExistingAndNewComponent {
  existingComponent: UserComponent | undefined;
  newComponent: ComponentSpec | undefined;
}

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
 * Fetches the component library and stores all components in local storage
 */
export const fetchAndStoreComponentLibrary =
  async (): Promise<ComponentLibrary> => {
    // First check if we already have the library in local storage
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

    // If not in storage or invalid, fetch from the URL
    const response = await fetch(COMPONENT_LIBRARY_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to load component library: ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const obj = loadObjectFromYamlData(arrayBuffer);

    if (!isValidComponentLibrary(obj)) {
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
export const storeComponentsFromLibrary = async (
  library: ComponentLibrary,
): Promise<void> => {
  const processFolder = async (folder: ComponentFolder) => {
    // Store each component in the folder
    for (const component of folder.components || []) {
      if (component.url) {
        await fetchAndStoreComponent(component.url);
      }
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
export const fetchAndStoreComponent = async (
  url: string,
): Promise<ComponentSpec | null> => {
  try {
    // Check if component already exists in storage
    const exists = await componentExistsByUrl(url);
    if (exists) {
      const storedComponent = await getComponentByUrl(url);
      if (storedComponent) {
        try {
          // Parse the component data
          const componentSpec = yaml.load(
            storedComponent.data,
          ) as ComponentSpec;
          return componentSpec;
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

    // Parse the component
    try {
      const componentSpec = yaml.load(text) as ComponentSpec;

      // Store the component
      await saveComponent({
        id: `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url,
        data: text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return componentSpec;
    } catch (error) {
      console.error(`Error parsing component at ${url}:`, error);

      // Still store the raw data even if parsing failed
      await saveComponent({
        id: `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url,
        data: text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return null;
    }
  } catch (error) {
    console.error(`Error fetching component at ${url}:`, error);
    return null;
  }
};

/**
 * Get all stored components from local storage
 */
export const getAllStoredComponents = async (): Promise<Component[]> => {
  return getAllComponents();
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
