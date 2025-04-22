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
import { cn } from "@/lib/utils";
import { EMPTY_GRAPH_COMPONENT_SPEC } from "@/providers/ComponentSpecProvider";
import { loadComponentSpec } from "@/services/componentSpecService";
import { type ComponentItemFromUrlProps } from "@/types/componentLibrary";
import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { containsSearchTerm } from "@/utils/searchUtils";

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
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(
    (event: DragEvent) => {
      setIsDragging(true);

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

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const tooltipContent = useMemo(() => {
    if (error) return `Error: ${error}`;
    if (isLoading) return "Loading component...";

    let content = displayName;

    if (componentSpec?.description) {
      content += `\n\nDescription: ${componentSpec.description}`;
    }

    if (componentSpec?.inputs?.length) {
      content += `\n\nInputs: ${componentSpec.inputs
        .map(
          (input) =>
            `${input.name}${input.description ? ` - ${input.description}` : ""}`,
        )
        .join(", ")}`;
    }

    if (componentSpec?.outputs?.length) {
      content += `\n\nOutputs: ${componentSpec.outputs
        .map(
          (output) =>
            `${output.name}${output.description ? ` - ${output.description}` : ""}`,
        )
        .join(", ")}`;
    }

    return content;
  }, [displayName, componentSpec, isLoading, error]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={1200} open={isDragging ? false : undefined}>
        <TooltipTrigger asChild>
          <SidebarMenuItem
            className={cn(
              "pl-2 py-1.5",
              error
                ? "cursor-not-allowed opacity-60"
                : "cursor-grab hover:bg-gray-100 active:bg-gray-200",
            )}
            draggable={!error && !isLoading}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="flex items-center gap-2">
              <File
                className={`h-4 w-4 flex-shrink-0 ${error ? "text-red-400" : "text-gray-400"}`}
              />
              {isLoading ? (
                <span className="text-gray-400 truncate text-sm">
                  Loading...
                </span>
              ) : error ? (
                <span className="truncate text-xs text-red-500">
                  Error loading component
                </span>
              ) : (
                <span className="truncate text-xs text-gray-800">
                  {displayName}
                </span>
              )}
            </div>
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs whitespace-pre-wrap">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const generateDigest = async (text: string): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const ComponentItemFromUrl = ({
  url,
  searchTerm = "",
}: ComponentItemFromUrlProps) => {
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

    const fetchComponentSpec = async () => {
      if (!url) return;

      try {
        setIsLoading(true);
        setError(null);

        const spec = await loadComponentSpec(url);
        if (signal.aborted) return;
        setComponentSpec(spec);

        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const text = await response.text();
        if (signal.aborted) return;
        setComponentText(text);

        const digest = await generateDigest(text);
        if (signal.aborted) return;
        setComponentDigest(digest);
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

    fetchComponentSpec();
    return () => controller.abort();
  }, [url]);

  const displayName = useMemo(
    () =>
      componentSpec?.name ||
      url.split("/").pop()?.replace(".yaml", "") ||
      "Component",
    [componentSpec, url],
  );

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;

    if (containsSearchTerm(displayName, searchTerm)) return true;

    if (
      componentSpec?.description &&
      containsSearchTerm(componentSpec.description, searchTerm)
    ) {
      return true;
    }

    const inputMatches = componentSpec?.inputs?.some(
      (input) =>
        containsSearchTerm(input.name, searchTerm) ||
        (input.description &&
          containsSearchTerm(input.description, searchTerm)),
    );

    if (inputMatches) return true;

    const outputMatches = componentSpec?.outputs?.some(
      (output) =>
        containsSearchTerm(output.name, searchTerm) ||
        (output.description &&
          containsSearchTerm(output.description, searchTerm)),
    );

    if (outputMatches) return true;

    return containsSearchTerm(url, searchTerm);
  }, [searchTerm, displayName, componentSpec, url]);

  if (!matchesSearch) return null;

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
