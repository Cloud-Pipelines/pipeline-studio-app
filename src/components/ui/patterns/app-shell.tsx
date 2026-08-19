import type { PropsWithChildren, ReactNode } from "react";

/**
 * AppShell — Layer 3 semantic primitive.
 *
 * Full-viewport application chrome: a fixed top bar above a working area that
 * fills the remaining height. The shell pins to the viewport (`h-svh`) and clips
 * overflow so the document itself never scrolls — inner regions (`ScrollRegion`,
 * `SideNav`, message lists) own their own scroll instead.
 */

interface AppShellProps {
  /** Persistent top navigation bar, rendered above the working area. */
  topBar: ReactNode;
}

export function AppShell({
  topBar,
  children,
}: PropsWithChildren<AppShellProps>) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {topBar}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

AppShell.displayName = "AppShell";
