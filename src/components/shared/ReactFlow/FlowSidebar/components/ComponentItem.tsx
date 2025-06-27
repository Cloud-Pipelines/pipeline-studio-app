import { File } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useMemo } from "react";

import { ComponentDetailsDialog } from "@/components/shared/Dialogs";
import { ComponentFavoriteToggle } from "@/components/shared/FavoriteComponentToggle";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { EMPTY_GRAPH_COMPONENT_SPEC } from "@/providers/ComponentSpecProvider";
import { type ComponentItemFromUrlProps } from "@/types/componentLibrary";
import type { ComponentReference, TaskSpec } from "@/utils/componentSpec";
import { getComponentName } from "@/utils/getComponentName";

interface ComponentMarkupProps {
  component: ComponentReference;
  isLoading?: boolean;
  error?: string | null;
}

const ComponentMarkup = ({
  component,
  isLoading,
  error,
}: ComponentMarkupProps) => {
  const { checkIfHighlighted } = useComponentLibrary();

  const { spec, digest, url } = component;

  const displayName = useMemo(
    () => getComponentName({ spec, url }),
    [spec, url],
  );

  const onDragStart = useCallback(
    (event: DragEvent) => {
      const taskSpec: TaskSpec = {
        componentRef: component,
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
    [component],
  );

  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <SidebarMenuItem
          className={cn(
            "pl-2 py-1.5",
            error
              ? "cursor-not-allowed opacity-60"
              : "cursor-grab hover:bg-gray-100 active:bg-gray-200",
            checkIfHighlighted(component) && "bg-orange-100",
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
                  <div className="flex flex-col w-[144px]">
                    <span className="truncate text-xs text-gray-800">
                      {displayName}
                    </span>
                    <span className="truncate text-[10px] text-gray-500 max-w-[100px] font-mono">
                      Ver: {digest}
                    </span>
                  </div>
                </div>
                <div className="flex align-items justify-end mr-[15px] h-full">
                  <ComponentFavoriteToggle component={component} />
                  <ComponentDetailsDialog
                    displayName={displayName}
                    component={component}
                  />
                </div>
              </div>
            )}
          </div>
        </SidebarMenuItem>
      </TooltipTrigger>
      <TooltipContent side="right">{displayName}</TooltipContent>
    </Tooltip>
  );
};

const ComponentItemFromUrl = ({ url }: ComponentItemFromUrlProps) => {
  if (!url) return null;

  const { isLoading, error, componentRef } = useComponentFromUrl(url);

  if (!componentRef.spec) {
    componentRef.spec = EMPTY_GRAPH_COMPONENT_SPEC;
  }

  return (
    <ComponentMarkup
      component={componentRef}
      isLoading={isLoading}
      error={error}
    />
  );
};

export { ComponentItemFromUrl, ComponentMarkup };
