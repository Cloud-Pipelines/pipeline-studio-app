import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { VerticalResizeHandle } from "@/components/ui/resize-handle";
import { cn } from "@/lib/utils";

import { ContextPanel } from "./ContextPanel";

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

interface CollapsibleContextPanelProps {
  defaultOpen?: boolean;
}

export function CollapsibleContextPanel({
  defaultOpen = true,
}: CollapsibleContextPanelProps = {}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="h-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            "absolute top-[95px] z-0 transition-all duration-300 bg-white rounded-r-md shadow-md p-0.5 pr-1 -translate-x-8"
          }
          aria-label={open ? "Collapse context panel" : "Expand context panel"}
        >
          <Icon name={open ? "PanelRightClose" : "PanelRightOpen"} />
        </Button>
      </CollapsibleTrigger>
      <div
        className={cn("relative h-full flex", !open && "!w-0")}
        style={{ width: `${DEFAULT_WIDTH}px` }}
      >
        {open && (
          <VerticalResizeHandle
            side="left"
            minWidth={MIN_WIDTH}
            maxWidth={MAX_WIDTH}
          />
        )}

        <CollapsibleContent className="flex-1 h-full overflow-hidden">
          <ContextPanel />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
