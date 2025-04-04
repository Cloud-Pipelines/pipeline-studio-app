import type { NodeProps } from "@xyflow/react";
import { Copy, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";

const toolbarHeight = 24;
const toolbarWidth = 64;

interface SelectionToolbarProps extends Record<string, unknown> {
  onDuplicate: () => void;
  onDelete: () => void;
}

const SelectionToolbar = ({ data }: NodeProps) => {
  const typedData = data as SelectionToolbarProps;

  return (
    <div
      className="flex gap-1 bg-white rounded-xs items-center justify-center"
      style={{
        width: toolbarWidth,
        height: toolbarHeight,
        border: "1px solid rgba(0, 89, 220, 0.4)",
      }}
    >
      <Button
        className="cursor-pointer h-full aspect-square w-min rounded-sm"
        variant="ghost"
        onClick={typedData.onDuplicate}
      >
        <Copy className="p-0.5" />
      </Button>
      <Button
        className="cursor-pointer h-full aspect-square w-min rounded-sm text-destructive hover:text-destructive"
        variant="ghost"
        onClick={typedData.onDelete}
      >
        <Trash className="p-0.5" />
      </Button>
    </div>
  );
};

export default SelectionToolbar;
