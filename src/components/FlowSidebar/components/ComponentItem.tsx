import { File } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
} from "@/componentSpec";
import { loadComponentSpec } from "@/services/componentSpecService";
import { type ComponentItemProps } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

const ComponentItem = ({ url, searchTerm = "" }: ComponentItemProps) => {
  if (!url) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [componentSpec, setComponentSpec] = useState<ComponentSpec | null>(
    null,
  );
  const [componentText, setComponentText] = useState<string | null>(null);
  const [componentDigest, setComponentDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create AbortController to handle cleanup
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchComponentSpec = async () => {
      try {
        setIsLoading(true);
        const spec = await loadComponentSpec(url);

        // Check if the request was aborted
        if (signal.aborted) return;

        setComponentSpec(spec);

        try {
          // Pass the signal to fetch to allow aborting the request
          const response = await fetch(url, { signal });
          const text = await response.text();

          // Check if the request was aborted
          if (signal.aborted) return;

          setComponentText(text);

          // Generate digest
          const digest = await crypto.subtle
            .digest("SHA-256", new TextEncoder().encode(text))
            .then((hashBuffer) => {
              return Array.from(new Uint8Array(hashBuffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            });

          // Check if the request was aborted
          if (signal.aborted) return;

          setComponentDigest(digest);
        } catch (textErr) {
          if (!signal.aborted) {
            console.error("Failed to fetch component text:", textErr);
          }
        }

        if (!signal.aborted) {
          setError(null);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error(`Error loading component from ${url}:`, err);
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchComponentSpec();

    // Cleanup function: abort any in-progress requests
    return () => controller.abort();
  }, [url]);

  const displayName = useMemo(() => {
    return (
      componentSpec?.name ||
      url.split("/").pop()?.replace(".yaml", "") ||
      "Component"
    );
  }, [componentSpec, url]);

  const onDragStart = useCallback(
    (event: DragEvent) => {
      const componentRef: ComponentReference = {
        url,
        spec: componentSpec || undefined,
        digest: componentDigest || undefined,
        text: componentText || undefined,
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
    [url, componentSpec, componentDigest, componentText],
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

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;

    // Search in name
    if (containsSearchTerm(displayName, searchTerm)) {
      return true;
    }

    // Search in description
    if (
      componentSpec?.description &&
      containsSearchTerm(componentSpec.description, searchTerm)
    ) {
      return true;
    }

    // Search in inputs/outputs
    if (
      componentSpec?.inputs?.some((input) =>
        containsSearchTerm(input.name, searchTerm),
      )
    ) {
      return true;
    }

    if (
      componentSpec?.outputs?.some((output) =>
        containsSearchTerm(output.name, searchTerm),
      )
    ) {
      return true;
    }

    // Search in URL for acronyms like GCS
    if (containsSearchTerm(url, searchTerm)) {
      return true;
    }

    return false;
  }, [searchTerm, displayName, componentSpec, url]);

  if (!matchesSearch) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={1200}>
        <TooltipTrigger asChild>
          <SidebarMenuItem
            className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-2 py-1.5"
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
                <span className="truncate text-xs text-gray-800">
                  {displayName}
                </span>
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
