import type { PropsWithChildren, ReactNode } from "react";

import { ScrollRegion } from "./scroll-region";

/**
 * WorkArea — Layer 3 semantic primitive.
 *
 * Working-area layout for dashboard-style pages inside `AppShell`: an optional
 * contextual sidebar beside a scrollable, centered main column. The main column
 * owns the only vertical scroll, so the surrounding shell never page-scrolls.
 */

interface WorkAreaProps {
  /** Optional contextual sidebar (e.g. `SideNav`) rendered to the left. */
  sidebar?: ReactNode;
}

export function WorkArea({
  sidebar,
  children,
}: PropsWithChildren<WorkAreaProps>) {
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 overflow-hidden">
      {sidebar}
      <ScrollRegion axis="y">
        <div className="mx-auto w-full max-w-5xl p-6">{children}</div>
      </ScrollRegion>
    </div>
  );
}

WorkArea.displayName = "WorkArea";
