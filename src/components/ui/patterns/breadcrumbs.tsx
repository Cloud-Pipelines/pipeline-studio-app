import { createLink } from "@tanstack/react-router";
import {
  type AnchorHTMLAttributes,
  Children,
  forwardRef,
  Fragment,
  type PropsWithChildren,
} from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/shell/lib/utils";

/**
 * Breadcrumbs — Layer 3 semantic primitive.
 *
 * Horizontal trail of links ending in the current page. Compose with
 * `CrumbLink` (router-aware) and `CrumbCurrent` (the active, non-link page);
 * separators are inserted automatically between entries.
 */

export function Breadcrumbs({ children }: PropsWithChildren) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <li aria-hidden="true" className="flex items-center">
                <Icon name="ChevronRight" size="sm" tone="subdued" />
              </li>
            ) : null}
            <li className="flex items-center">{item}</li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

Breadcrumbs.displayName = "Breadcrumbs";

const crumbLinkClass =
  "text-muted-foreground transition-colors hover:text-foreground";

const CrumbLinkImpl = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>
>(function CrumbLinkImpl({ className, children, ...props }, ref) {
  return (
    <a ref={ref} className={cn(crumbLinkClass, className)} {...props}>
      {children}
    </a>
  );
});

/** Router-aware breadcrumb link to an ancestor page. */
export const CrumbLink = createLink(CrumbLinkImpl);

/** The current (last) breadcrumb — plain, non-interactive text. */
export function CrumbCurrent({ children }: PropsWithChildren) {
  return (
    <span aria-current="page" className="font-medium text-foreground">
      {children}
    </span>
  );
}

CrumbCurrent.displayName = "CrumbCurrent";
