import { downloadDataWithCache } from "@/utils/cache";
import {
  type ComponentSpec,
  isGraphImplementation,
} from "@/utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  loadComponentAsRefFromText,
  preloadComponentReferences,
} from "@/utils/componentStore";

const preparedComponentCache = new Map<string, ComponentSpec>();

const loadInlineComponentRefs = async (tasks: Record<string, any>) => {
  for (const taskId in tasks) {
    const task = tasks[taskId];

    if (
      task.componentRef &&
      task.componentRef.text &&
      !task.componentRef.text.startsWith("http") &&
      !task.componentRef.spec
    ) {
      try {
        const loadedRef = await loadComponentAsRefFromText(
          task.componentRef.text,
        );
        task.componentRef.spec = loadedRef.spec;
      } catch (err) {
        console.warn(`Could not parse component text for task ${taskId}`, err);
      }
    }
  }
};

export const prepareComponentRefForEditor = async (
  ref: ComponentReferenceWithSpec,
) => {
  const cacheKey = ref.digest;

  if (preparedComponentCache.has(cacheKey)) {
    return preparedComponentCache.get(cacheKey);
  }

  const safeSpec = structuredClone(ref.spec);

  if (
    safeSpec.implementation &&
    isGraphImplementation(safeSpec.implementation)
  ) {
    const graphImpl = structuredClone(safeSpec.implementation.graph);

    if (graphImpl.tasks) {
      await loadInlineComponentRefs(graphImpl.tasks);
    }

    safeSpec.implementation.graph = graphImpl;
  }

  const componentSpec = await preloadComponentReferences(
    safeSpec,
    downloadDataWithCache,
  );

  // Cache the result to avoid generating new spec objects in thew future if the same spec is used again
  preparedComponentCache.set(cacheKey, componentSpec);

  return componentSpec;
};
