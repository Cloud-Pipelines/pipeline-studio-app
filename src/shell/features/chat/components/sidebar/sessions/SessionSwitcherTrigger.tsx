// local primitive — full-width clickable header button that opens the session
// dropdown switcher. Styles a raw <button>, so it is exempt from
// tangle-ui/no-classname-on-primitives.
import { type ComponentProps, forwardRef } from "react";

import { cn } from "@/shell/lib/utils";

export const SessionSwitcherTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>(function SessionSwitcherTrigger({ className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center rounded-sm text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
