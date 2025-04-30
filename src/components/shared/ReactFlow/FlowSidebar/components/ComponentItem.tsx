import { File } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ComponentDetails from "@/components/shared/Dialogs/ComponentDetails";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { EMPTY_GRAPH_COMPONENT_SPEC } from "@/providers/ComponentSpecProvider";
import {
  fetchAndStoreComponent,
  generateDigest,
  parseComponentData,
} from "@/services/componentService";
import { type ComponentItemFromUrlProps } from "@/types/componentLibrary";
import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { getComponentByUrl } from "@/utils/localforge";

interface ComponentMarkupProps {
  url: string;
  componentSpec: ComponentSpec;
  componentDigest: string;
  componentText: string;
  displayName: string;
  isLoading?: boolean;
  error?: string | null;
}

const ComponentMarkup = ({
  url,
  componentSpec,
  componentDigest,
  componentText,
  displayName,
  isLoading,
  error,
}: ComponentMarkupProps) => {
  const onDragStart = useCallback(
    (event: DragEvent) => {
      const componentRef: ComponentReference = {
        url,
        spec: componentSpec,
        digest: componentDigest,
        text: componentText,
      };

      const taskSpec: TaskSpec = {
        componentRef,
      };

      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({ task: taskSpec }),
      );

      event.dataTransfer.setData(
        "DragStart.offset",
        JSON.stringify({
          offsetX: event.nativeEvent.offsetX,
          offsetY: event.nativeEvent.offsetY,
        }),
      );

      event.dataTransfer.effectAllowed = "move";
    },
    [url, componentSpec, componentDigest, componentText],
  );

  return (
    <>
      <SidebarMenuItem
        className={cn(
          "pl-2 py-1.5",
          error
            ? "cursor-not-allowed opacity-60"
            : "cursor-grab hover:bg-gray-100 active:bg-gray-200",
        )}
        draggable={!error && !isLoading}
        onDragStart={onDragStart}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-gray-400 truncate text-sm">Loading...</span>
          ) : error ? (
            <span className="truncate text-xs text-red-500">
              Error loading component
            </span>
          ) : (
            <div className="flex-1 flex">
              <div className="flex gap-2 w-full">
                <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate text-xs text-gray-800 max-w-[200px]">
                  {displayName}
                </span>
              </div>
              <div className="flex-1 flex justify-end mr-[15px]">
                <ComponentDetails
                  url={url}
                  displayName={displayName}
                  componentSpec={componentSpec}
                  componentDigest={componentDigest}
                  componentText={componentText}
                />
              </div>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </>
  );
};

const ComponentItemFromUrl = ({ url }: ComponentItemFromUrlProps) => {
  if (!url) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [componentSpec, setComponentSpec] = useState<ComponentSpec | null>(
    null,
  );
  const [componentText, setComponentText] = useState<string | null>(null);
  const [componentDigest, setComponentDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadComponent = async () => {
      if (!url) return;

      try {
        setIsLoading(true);
        setError(null);

        const storedComponent = await getComponentByUrl(url);

        if (storedComponent) {
          if (signal.aborted) return;
          // Parse the component data
          const text = storedComponent.data;
          setComponentText(text);

          try {
            // Parse the component spec from the text
            const parsedSpec = parseComponentData(text);
            if (parsedSpec) {
              setComponentSpec(parsedSpec);
              const digest = await generateDigest(text);
              setComponentDigest(digest);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error("Error parsing component from local storage:", err);
            // Fall through to network fetch
          }
        }

        // If component doesn't exist in storage or parsing failed, fetch and store it
        const spec = await fetchAndStoreComponent(url);
        if (signal.aborted) return;

        if (spec) {
          setComponentSpec(spec);

          // Get the stored component to get the text
          const updatedComponent = await getComponentByUrl(url);
          if (updatedComponent && !signal.aborted) {
            const text = updatedComponent.data;
            setComponentText(text);
            const digest = await generateDigest(text);
            setComponentDigest(digest);
          }
        } else {
          throw new Error("Failed to load component specification");
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();
    return () => controller.abort();
  }, [url]);

  const displayName = useMemo(
    () =>
      componentSpec?.name ||
      url.split("/").pop()?.replace(".yaml", "") ||
      "Component",
    [componentSpec, url],
  );

  return (
    <ComponentMarkup
      url={url}
      componentSpec={componentSpec || EMPTY_GRAPH_COMPONENT_SPEC}
      componentDigest={componentDigest || ""}
      componentText={componentText || ""}
      displayName={displayName}
      isLoading={isLoading}
      error={error}
    />
  );
};

export { ComponentItemFromUrl, ComponentMarkup };
