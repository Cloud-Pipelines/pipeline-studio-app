import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

import { ContextPanel } from "./ContextPanel";

export function CollapsibleContextPanel({
  defaultSize = 30,
  minSize = 15,
  maxSize = 50,
  collapsedSize = 3,
}: {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsedSize?: number;
}) {
  const resizablePanelRef = useRef<ImperativePanelHandle>(null);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ResizablePanel
      ref={resizablePanelRef}
      collapsible
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsedSize={collapsedSize}
      onCollapse={() => setCollapsed(true)}
      onExpand={() => setCollapsed(false)}
    >
      {collapsed && (
        <div className="relative">
          <Button
            className="absolute top-2 right-2"
            variant="ghost"
            onClick={() => {
              resizablePanelRef.current?.expand();
              resizablePanelRef.current?.resize(30);
            }}
          >
            <PanelRightOpen className="h-6 w-6" />
          </Button>
        </div>
      )}
      <div className={cn("h-full relative", collapsed && "hidden")}>
        <Button
          className="absolute top-2 right-2"
          variant="ghost"
          onClick={() => {
            resizablePanelRef.current?.collapse();
          }}
        >
          <PanelRightClose className="h-6 w-6" />
        </Button>
        <ContextPanel />
      </div>
    </ResizablePanel>
  );
}
