import { File } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SidebarMenuItem } from "@/components/ui/sidebar";
import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
} from "@/componentSpec";
import { loadComponentSpec } from "@/services/componentSpecService";
import { type ComponentItemProps } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

/**
 * Component to display a single component with fetched metadata
 */
const ComponentItem = ({ url, searchTerm = "" }: ComponentItemProps) => {
  // Skip rendering if URL is undefined
  if (!url) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [componentSpec, setComponentSpec] = useState<ComponentSpec | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchComponentSpec = async () => {
      try {
        setIsLoading(true);
        const spec = await loadComponentSpec(url);

        if (isMounted) {
          setComponentSpec(spec);
          setError(null);
        }
      } catch (err) {
        console.error(`Error loading component from ${url}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchComponentSpec();

    return () => {
      isMounted = false;
    };
  }, [url]);

  const displayName = useMemo(() => {
    return (
      componentSpec?.name ||
      url.split("/").pop()?.replace(".yaml", "") ||
      "Component"
    );
  }, [componentSpec, url]);

  const onDragStart = useCallback(
    (event: React.DragEvent) => {
      // Create a component reference with the spec if available
      const componentRef: ComponentReference = {
        url,
        spec: componentSpec || undefined,
      };

      // Create a task spec that the graph can understand
      const taskSpec: TaskSpec = {
        componentRef,
      };

      // Set the data in the format expected by the onDrop handler
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({ task: taskSpec }),
      );

      // Add offset information for better positioning
      event.dataTransfer.setData(
        "DragStart.offset",
        JSON.stringify({
          offsetX: event.nativeEvent.offsetX,
          offsetY: event.nativeEvent.offsetY,
        }),
      );

      event.dataTransfer.effectAllowed = "move";
    },
    [url, componentSpec],
  );

  const tooltipContent = useMemo(() => {
    if (isLoading) return "Loading component information...";
    if (error) return `Error: ${error}`;

    let content = displayName;
    if (componentSpec?.description) {
      content += `\n\nDescription: ${componentSpec.description}`;
    }
    if (componentSpec?.inputs?.length) {
      content += `\n\nInputs: ${componentSpec.inputs
        .map((input) => input.name)
        .join(", ")}`;
    }
    if (componentSpec?.outputs?.length) {
      content += `\n\nOutputs: ${componentSpec.outputs
        .map((output) => output.name)
        .join(", ")}`;
    }
    return content;
  }, [isLoading, error, displayName, componentSpec]);

  // Check if component matches search term
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;

    // Search in name
    if (containsSearchTerm(displayName, searchTerm)) return true;

    // Search in description
    if (
      componentSpec?.description &&
      containsSearchTerm(componentSpec.description, searchTerm)
    )
      return true;

    // Search in inputs/outputs
    if (
      componentSpec?.inputs?.some((input) =>
        containsSearchTerm(input.name, searchTerm),
      )
    )
      return true;

    if (
      componentSpec?.outputs?.some((output) =>
        containsSearchTerm(output.name, searchTerm),
      )
    )
      return true;

    // Search in URL for acronyms like GCS
    if (containsSearchTerm(url, searchTerm)) return true;

    return false;
  }, [searchTerm, displayName, componentSpec, url]);

  if (!matchesSearch) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={1200}>
        <TooltipTrigger asChild>
          <SidebarMenuItem
            className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-9"
            draggable
            onDragStart={onDragStart}
          >
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {isLoading ? (
                <span className="text-gray-400 truncate text-sm">
                  Loading...
                </span>
              ) : (
                <span className="truncate text-sm">{displayName}</span>
              )}
            </div>
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-wrap">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ComponentItem;
