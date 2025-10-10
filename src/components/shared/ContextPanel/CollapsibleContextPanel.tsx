import { cn } from "@/lib/utils";

import { ContextPanel } from "./ContextPanel";

export function CollapsibleContextPanel() {
  return (
    <div className={cn("h-full relative w-full")}>
      <ContextPanel />
    </div>
  );
}
