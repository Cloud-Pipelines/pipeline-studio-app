import { useQueryClient } from "@tanstack/react-query";
import { File } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import {
  ComponentDetailsDialog,
  ConfirmationDialog,
} from "@/components/shared/Dialogs";
import { FavoriteStar } from "@/components/shared/FavoriteStar";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import useComponentFromUrl from "@/hooks/useComponentFromUrl";
import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { EMPTY_GRAPH_COMPONENT_SPEC } from "@/providers/ComponentSpecProvider";
import { type ComponentItemFromUrlProps } from "@/types/componentLibrary";
import type { ComponentReference, TaskSpec } from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";
import { getComponentName } from "@/utils/getComponentName";

interface ComponentMarkupProps {
  component: ComponentReference;
  isLoading?: boolean;
  error?: string | null;
  onFavorite?: () => void;
}

const ComponentMarkup = ({
  component,
  isLoading,
  error,
  onFavorite,
}: ComponentMarkupProps) => {
  const { checkIfUserComponent } = useComponentLibrary();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const { name: fileName, spec, digest, url } = component;

  const isUserComponent = useMemo(
    () => checkIfUserComponent(component),
    [component, checkIfUserComponent],
  );

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

  // Delete User Components
  const handleDelete = useCallback(async () => {
    try {
      await deleteComponentFileFromList(
        USER_COMPONENTS_LIST_NAME,
        fileName ?? "",
      );
      queryClient.invalidateQueries({ queryKey: ["userComponents"] });
    } catch (error) {
      console.error("Error deleting component:", error);
    }
  }, [fileName, queryClient]);

  /* Confirmation Dialog handlers */
  const openConfirmationDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    handleDelete();
    setIsOpen(false);
  }, [handleDelete]);

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
                <FavoriteStar
                  active={component.favorited}
                  onClick={
                    isUserComponent ? openConfirmationDialog : onFavorite
                  }
                />
                <ComponentDetailsDialog
                  displayName={displayName}
                  component={component}
                  onDelete={isUserComponent ? handleDelete : undefined}
                />
                <ConfirmationDialog
                  isOpen={isOpen}
                  title="Delete custom component?"
                  description={`"${displayName}" is a custom user component. Unstarring it will remove it from your library. This action cannot be undone.`}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </>
  );
};

const ComponentItemFromUrl = ({
  url,
  onFavorite,
}: ComponentItemFromUrlProps) => {
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
      onFavorite={onFavorite}
    />
  );
};

export { ComponentItemFromUrl, ComponentMarkup };
