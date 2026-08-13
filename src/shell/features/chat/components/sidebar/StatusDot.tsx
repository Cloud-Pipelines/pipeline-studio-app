// local primitive — small connection status indicator dot.
// Styles a raw <span>, so it is exempt from tangle-ui/no-classname-on-primitives.
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shell/lib/utils";

const statusDotCva = cva("size-2 shrink-0 rounded-full", {
  variants: {
    variant: {
      busy: "bg-green-800 animate-pulse animate-very-fast",
      active: "bg-green-200",
      disconnected: "bg-muted-foreground",
      completed: "bg-muted-foreground",
      killed: "bg-destructive",
      error: "bg-critical",
    },
  },
});

export function StatusDot({
  variant,
  connected,
}: VariantProps<typeof statusDotCva> & { connected?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        statusDotCva({
          variant: variant || (connected ? "active" : "disconnected"),
        }),
      )}
    />
  );
}
