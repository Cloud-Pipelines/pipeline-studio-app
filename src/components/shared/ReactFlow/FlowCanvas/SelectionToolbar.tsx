import { CircleFadingArrowUp, ClipboardPlus, Copy, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SelectionToolbarProps {
  onCopy?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onUpgrade?: () => void;
}

const SelectionToolbar = ({
  onCopy,
  onDuplicate,
  onDelete,
  onUpgrade,
}: SelectionToolbarProps) => {
  return (
    <div
      className="flex gap-1 bg-white rounded-xs items-center justify-center"
      style={{
        border: "1px solid rgba(0, 89, 220, 0.4)",
      }}
    >
      {onUpgrade && (
        <Button
          className="h-full aspect-square w-min rounded-sm p-1"
          variant="ghost"
          onClick={onUpgrade}
          size="icon"
        >
          <CircleFadingArrowUp className="p-0.5" />
        </Button>
      )}
      {onDuplicate && (
        <Button
          className="cursor-pointer h-full aspect-square w-min rounded-sm p-1"
          variant="ghost"
          onClick={onDuplicate}
          size="icon"
        >
          <Copy className="p-0.5" />
        </Button>
      )}
      {onCopy && (
        <Button
          className="cursor-pointer h-full aspect-square w-min rounded-sm p-1"
          variant="ghost"
          onClick={onCopy}
          size="icon"
        >
          <ClipboardPlus className="p-0.5" />
        </Button>
      )}
      {onDelete && (
        <Button
          className="h-full aspect-square w-min rounded-sm text-destructive hover:text-destructive p-1"
          variant="ghost"
          onClick={onDelete}
          size="icon"
        >
          <Trash className="p-0.5" />
        </Button>
      )}
    </div>
  );
};

export default SelectionToolbar;
