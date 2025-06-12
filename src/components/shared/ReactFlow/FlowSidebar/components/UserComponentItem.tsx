import { useQueryClient } from "@tanstack/react-query";
import { File } from "lucide-react";
import { type DragEvent, useCallback } from "react";

import { ComponentDetailsDialog } from "@/components/shared/Dialogs";
import { SidebarMenuItem } from "@/components/ui/sidebar";
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
    try {
      await deleteComponentFileFromList(USER_COMPONENTS_LIST_NAME, fileName);
      queryClient.invalidateQueries({ queryKey: ["userComponents"] });
    } catch (error) {
      console.error("Error deleting component:", error);
    }
  }, [fileName, queryClient]);

  return (
    <SidebarMenuItem
      className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-2 py-1.5 group flex justify-between relative"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex-1 flex w-full">
        <div className="flex gap-2 w-fit">
          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex flex-col w-[160px]">
            <span className="truncate text-xs text-gray-800">
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
            onDelete={handleDelete}
          />
        </div>
      </div>
    </SidebarMenuItem>
  );
};

export default UserComponentItem;
