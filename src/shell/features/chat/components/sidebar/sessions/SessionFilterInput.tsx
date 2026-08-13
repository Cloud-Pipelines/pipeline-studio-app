// local primitive — single-line quick-filter input for the session dropdown
// switcher. Styles a raw <input>, so it is exempt from
// tangle-ui/no-classname-on-primitives.
import { type ComponentProps, forwardRef } from "react";

import { cn } from "@/shell/lib/utils";

export const SessionFilterInput = forwardRef<
  HTMLInputElement,
  ComponentProps<"input">
>(function SessionFilterInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="text"
      className={cn(
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
});
