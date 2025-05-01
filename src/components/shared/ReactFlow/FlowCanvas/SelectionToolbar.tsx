import type { NodeProps } from "@xyflow/react";
import { Copy, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SelectionToolbarProps } from "@/types/selectionToolbar";

const SelectionToolbar = ({ data }: NodeProps) => {
  const typedData = data as SelectionToolbarProps;
  const hidden = typedData.hidden;

  return (
    <div
      className={cn(
        "flex gap-1 bg-white rounded-xs items-center justify-center",
        hidden && "invisible",
      )}
      style={{
        border: "1px solid rgba(0, 89, 220, 0.4)",
      }}
    >
      <Button
        className="cursor-pointer h-full aspect-square w-min rounded-sm p-1"
        variant="ghost"
        onClick={typedData.onDuplicate}
        size="icon"
      >
        <Copy className="p-0.5" />
      </Button>
      <Button
        className="cursor-pointer h-full aspect-square w-min rounded-sm text-destructive hover:text-destructive p-1"
        variant="ghost"
        onClick={typedData.onDelete}
        size="icon"
      >
        <Trash className="p-0.5" />
      </Button>
    </div>
  );
};

export default SelectionToolbar;
