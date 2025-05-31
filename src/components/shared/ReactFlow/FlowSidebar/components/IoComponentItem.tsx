import { File } from "lucide-react";
import { type DragEvent } from "react";

import { SidebarMenuItem } from "@/components/ui/sidebar";

type IoComponentItemType = "input" | "output";

interface IoComponentItemProps {
  type: IoComponentItemType;
}

const IoComponentItem = ({ type }: IoComponentItemProps) => {
  const onDragStart = (event: DragEvent) => {
    console.log('name', type)
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ [type]: type }),
    );

    event.dataTransfer.setData(
      "DragStart.offset",
      JSON.stringify({
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY,
      }),
    );

    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <SidebarMenuItem
      className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-2 py-1.5 group flex justify-between relative"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex gap-2 w-full">
        <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="truncate text-xs text-gray-800 max-w-[200px] capitalize">
          {type}
        </span>
      </div>
    </SidebarMenuItem>
  );
};

export default IoComponentItem;
