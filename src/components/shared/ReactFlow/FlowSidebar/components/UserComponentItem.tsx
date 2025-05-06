import { useQueryClient } from "@tanstack/react-query";
import { File, TrashIcon } from "lucide-react";
import { type DragEvent, useCallback, useState } from "react";

import { ComponentDetailsDialog } from "@/components/shared/Dialogs";
import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ComponentReference, ComponentSpec } from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";

interface UserComponentItemProps {
  url: string;
  fileName: string;
  componentSpec: ComponentSpec;
  componentDigest: string;
  componentText: string;
  displayName: string;
}

const UserComponentItem = ({
  url,
  fileName,
  componentSpec,
  componentDigest,
  componentText,
  displayName,
}: UserComponentItemProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  const onDragStart = useCallback(
    (event: DragEvent) => {
      const componentRef: ComponentReference = {
        url,
        spec: componentSpec,
        digest: componentDigest,
        text: componentText,
      };

      const taskSpec = {
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

  const handleDelete = useCallback(async () => {
    if (confirmDelete) {
      try {
        await deleteComponentFileFromList(USER_COMPONENTS_LIST_NAME, fileName);
        queryClient.invalidateQueries({ queryKey: ["userComponents"] });
      } catch (error) {
        console.error("Error deleting component:", error);
      }
    } else {
      setConfirmDelete(true);
    }
  }, [fileName, queryClient, confirmDelete]);

  return (
    <SidebarMenuItem
      className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-2 py-1.5 group flex justify-between relative"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex-1 flex">
        <div className="flex gap-2 w-full">
          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate text-xs text-gray-800 max-w-[200px]">
            {displayName}
          </span>
        </div>
        <div className="flex-1 flex justify-end mr-[15px]">
          <ComponentDetailsDialog
            url={url}
            displayName={displayName}
            componentSpec={componentSpec}
            componentDigest={componentDigest}
            componentText={componentText}
            onClose={() => {
              setConfirmDelete(false);
            }}
            actions={[
              <TooltipProvider key="delete-component">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={handleDelete}
                    >
                      <div className="flex items-center gap-2">
                        <TrashIcon />
                        {confirmDelete && (
                          <span className="text-xs">Confirm Delete</span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {confirmDelete ? "Confirm Delete" : "Delete Component"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>,
            ]}
          />
        </div>
      </div>
    </SidebarMenuItem>
  );
};

export default UserComponentItem;
