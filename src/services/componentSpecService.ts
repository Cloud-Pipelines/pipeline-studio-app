import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import type { ComponentSpec } from "@/componentSpec";
import { type ComponentFolder } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

// Global cache for component specs
const componentSpecCache = new Map<string, Promise<ComponentSpec>>();

/**
 * Loads a component spec from a URL with caching
 */
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
      if (!component.url) return false;
      const componentName =
        component.url.split("/").pop()?.replace(".yaml", "") || "";
      return (
        containsSearchTerm(componentName, searchTerm) ||
        containsSearchTerm(component.url, searchTerm)
      );
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
