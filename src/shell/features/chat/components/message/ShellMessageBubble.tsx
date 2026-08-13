// local primitive — chat message bubble (alignment + tonal background per
// author). Styles a raw <div>, so it is exempt from
// tangle-ui/no-classname-on-primitives.
import { cva, type VariantProps } from "class-variance-authority";
import type { PropsWithChildren } from "react";

import { cn } from "@/shell/lib/utils";

const shellMessageBubbleVariants = cva(
  "flex w-fit max-w-full flex-col gap-1 rounded-lg px-3 py-2 min-w-0 break-words",
  {
    variants: {
      variant: {
        own: "bg-primary/10 text-foreground",
        human: "bg-primary/10",
        agent:
          "bg-message-surface text-message-surface-foreground border border-message-surface-border shadow-sm",
        memory:
          "message-memory bg-accent/35 border border-accent-foreground/15",
      },
    },
    defaultVariants: {
      variant: "human",
    },
  },
);

export type ShellMessageBubbleVariant = NonNullable<
  VariantProps<typeof shellMessageBubbleVariants>["variant"]
>;

interface ShellMessageBubbleProps
  extends PropsWithChildren, VariantProps<typeof shellMessageBubbleVariants> {
  className?: string;
  /** When false, native text selection is disabled (e.g. collapsed thinking). */
  selectable?: boolean;
}

export function ShellMessageBubble({
  variant,
  className,
  selectable = true,
  children,
}: ShellMessageBubbleProps) {
  return (
    <div
      className={cn(
        shellMessageBubbleVariants({ variant }),
        !selectable && "select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
