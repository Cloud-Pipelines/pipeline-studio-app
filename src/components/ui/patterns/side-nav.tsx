import { createLink } from "@tanstack/react-router";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { cn } from "@/shell/lib/utils";

/**
 * SideNav — Layer 3 semantic primitive.
 *
 * Contextual left sidebar inside the `AppShell` working area: a fixed-width
 * (`w-64`) column that scrolls independently. Group items with `SideNavSection`
 * and render router-aware entries with `SideNavLink`.
 */

export function SideNav({ children }: PropsWithChildren) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
      {children}
    </aside>
  );
}

SideNav.displayName = "SideNav";

interface SideNavSectionProps {
  /** Optional uppercase section label. */
  title?: ReactNode;
}

export function SideNavSection({
  title,
  children,
}: PropsWithChildren<SideNavSectionProps>) {
  return (
    <div className="flex flex-col gap-1">
      {title ? (
        <div className="px-2 pt-1 pb-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

SideNavSection.displayName = "SideNavSection";

const sideNavLinkClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const SideNavLinkImpl = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>
>(function SideNavLinkImpl({ className, children, ...props }, ref) {
  return (
    <a ref={ref} className={cn(sideNavLinkClass, className)} {...props}>
      {children}
    </a>
  );
});

const CreatedSideNavLink = createLink(SideNavLinkImpl);

/** Router-aware sidebar link. Highlights when its route is active. */
export const SideNavLink: typeof CreatedSideNavLink = (props) => (
  <CreatedSideNavLink
    activeProps={{
      className: "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
    }}
    {...props}
  />
);
