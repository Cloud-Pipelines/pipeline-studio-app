import { File } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useMemo } from "react";

import { ComponentDetailsDialog } from "@/components/shared/Dialogs";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { cn } from "@/lib/utils";
import { EMPTY_GRAPH_COMPONENT_SPEC } from "@/providers/ComponentSpecProvider";
import { type ComponentItemFromUrlProps } from "@/types/componentLibrary";
import type {
  ComponentReference,
  ComponentSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { getComponentName } from "@/utils/getComponentName";

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
              <div className="flex gap-2 w-full items-center">
                <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="truncate text-xs text-gray-800 max-w-[200px]">
                    {displayName}
                  </span>
                  <span className="truncate text-[10px] text-gray-500 max-w-[100px] font-mono">
                    Ver: {componentDigest}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex justify-end mr-[15px]">
                <ComponentDetailsDialog
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

  const { isLoading, error, componentRef } = useComponentFromUrl(url);

  const { spec, digest, text } = componentRef;

  const displayName = useMemo(
    () => getComponentName({ spec: spec ?? undefined, url }),
    [spec, url],
  );

  return (
    <ComponentMarkup
      url={url}
      componentSpec={spec || EMPTY_GRAPH_COMPONENT_SPEC}
      componentDigest={digest || ""}
      componentText={text || ""}
      displayName={displayName}
      isLoading={isLoading}
      error={error}
    />
  );
};

export { ComponentItemFromUrl, ComponentMarkup };
