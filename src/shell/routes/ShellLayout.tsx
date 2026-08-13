import { Outlet } from "@tanstack/react-router";

import { BlockStack } from "@/components/ui/layout";
import { SessionStatusProvider } from "@/shell/features/sessions/components/SessionStatusProvider";

/**
 * Layout for the `/shell` routes. Holds the one lobby socket that feeds live
 * run status to every session list, so status survives navigating between the
 * sessions table and an open chat.
 */
export function ShellLayout() {
  return (
    <SessionStatusProvider>
      <BlockStack grow align="stretch">
        <Outlet />
      </BlockStack>
    </SessionStatusProvider>
  );
}
