import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import type { ComponentSpec } from "@/componentSpec";
import { type ComponentFolder } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

const componentSpecCache = new Map<string, Promise<ComponentSpec>>();

export const loadComponentSpec = (url: string): Promise<ComponentSpec> => {
  if (!componentSpecCache.has(url)) {
    const loadPromise = new Promise<ComponentSpec>((resolve, reject) => {
      const loadComponentData = (data: ArrayBuffer) => {
        const obj = loadObjectFromYamlData(data);
        return obj as ComponentSpec;
      };

      downloadDataWithCache(url, loadComponentData).then(resolve).catch(reject);
    });

    componentSpecCache.set(url, loadPromise);
  }

  return componentSpecCache.get(url)!;
};

/**
 * Recursively checks if a folder has any matching components
 */
export const hasChildMatchingComponent = (
  folder: ComponentFolder,
  searchTerm: string,
): boolean => {
  // Check direct child components
  if (folder.components?.length) {
    const hasMatchingComponents = folder.components.some((component) => {
      // If component has a loaded spec, check all its fields
      if (component.spec) {
        // Check component name from spec (more accurate)
        if (containsSearchTerm(component.spec.name || "", searchTerm))
          return true;

        // Check component description
        if (containsSearchTerm(component.spec.description || "", searchTerm))
          return true;
      }

      if (!component.url) return false;

      // Check component name from URL (fallback if spec isn't available)
      const componentName =
        component.url.split("/").pop()?.replace(".yaml", "") || "";
      if (containsSearchTerm(componentName, searchTerm)) return true;

      // As a last resort, check the URL
      // This is less ideal as URLs may contain information not relevant to functionality
      return containsSearchTerm(component.url, searchTerm);
    });

    if (hasMatchingComponents) return true;
  }

  // Check subfolders recursively
  if (folder.folders?.length) {
    return folder.folders.some(
      (subfolder) =>
        containsSearchTerm(subfolder.name, searchTerm) ||
        hasChildMatchingComponent(subfolder, searchTerm),
    );
  }

  return false;
};
