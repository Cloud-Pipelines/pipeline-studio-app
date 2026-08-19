import { createLink } from "@tanstack/react-router";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { cn } from "@/shell/lib/utils";

/**
 * TopNav — Layer 3 semantic primitive.
 *
 * Persistent top navigation bar: a fixed-height (`h-14`) row with a brand slot,
 * inline nav links, and trailing actions. Sits at the top of `AppShell`.
 */

interface TopNavProps {
  /** Brand / logo slot (left edge). */
  brand: ReactNode;
  /** Primary navigation links (use `TopNavLink`). */
  links?: ReactNode;
  /** Trailing actions (right edge). */
  actions?: ReactNode;
}

export function TopNav({ brand, links, actions }: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">{brand}</div>
      {links ? <nav className="flex items-center gap-1">{links}</nav> : null}
      {actions ? (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

TopNav.displayName = "TopNav";

const topNavLinkClass =
  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const TopNavLinkImpl = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>
>(function TopNavLinkImpl({ className, children, ...props }, ref) {
  return (
    <a ref={ref} className={cn(topNavLinkClass, className)} {...props}>
      {children}
    </a>
  );
});

const CreatedTopNavLink = createLink(TopNavLinkImpl);

/** Router-aware nav link for the top bar. Highlights when its route is active. */
export const TopNavLink: typeof CreatedTopNavLink = (props) => (
  <CreatedTopNavLink
    activeProps={{ className: "bg-accent text-accent-foreground" }}
    {...props}
  />
);
