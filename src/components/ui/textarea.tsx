import * as React from "react";

import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Grow with content up to a max height, then scroll, and fill the inline axis. */
  autoGrow?: boolean;
}

function Textarea({ className, autoGrow = false, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        autoGrow && "max-h-32 flex-1 resize-none overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
