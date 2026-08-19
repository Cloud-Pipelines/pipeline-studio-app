import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

import { cn } from "@/shell/lib/utils";

/**
 * Table — Layer 3 semantic primitives.
 *
 * Lightweight, semantic data table (`Table` + header/body/row/head/cell). Rows
 * with an `onClick` become keyboard-activatable buttons (Enter/Space) so a table
 * can act as a navigable index.
 */

export const Table = forwardRef<
  HTMLTableElement,
  HTMLAttributes<HTMLTableElement>
>(function Table({ className, ...props }, ref) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom border-collapse text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  );
});

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
});

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Marks the row as clickable (pointer cursor + keyboard activation). */
  clickable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, clickable, onClick, ...props }, ref) {
    const isInteractive = clickable ?? onClick != null;
    const onKeyDown = isInteractive
      ? (event: KeyboardEvent<HTMLTableRowElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }
      : undefined;
    return (
      <tr
        ref={ref}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        className={cn(
          "border-b border-border transition-colors hover:bg-muted/50",
          isInteractive && "cursor-pointer",
          className,
        )}
        {...props}
      />
    );
  },
);

export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-9 px-3 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
});

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell({ className, ...props }, ref) {
  return (
    <td
      ref={ref}
      className={cn("px-3 py-2 align-middle", className)}
      {...props}
    />
  );
});
