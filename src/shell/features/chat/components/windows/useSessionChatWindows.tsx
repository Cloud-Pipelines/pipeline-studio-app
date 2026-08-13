import { useEffect } from "react";

import { useSharedStores } from "@/routes/v2/shared/store/SharedStoreContext";
import type { WindowOptions } from "@/routes/v2/shared/windows/types";

import { AgentsWindow } from "./AgentsWindow";
import { AssetsWindow } from "./AssetsWindow";
import { SessionSwitcherWindow } from "./SessionSwitcherWindow";

const SHARED_OPTIONS = {
  defaultDockState: "left",
  startVisible: true,
  persisted: true,
  disabledActions: ["close", "hide"],
} satisfies Partial<WindowOptions>;

/**
 * Opens the three SessionChat panels (Session, Agents, Assets) as docked
 * windows exactly once. Content reads live state from the windows context, so
 * opening once is enough — re-opening with the same id would re-run
 * `bringToFront` and churn the z-order every render.
 */
export function useSessionChatWindows() {
  const { windows } = useSharedStores();
  useEffect(() => {
    windows.openWindow(<AgentsWindow />, {
      ...SHARED_OPTIONS,
      id: "agents",
      title: "Agents",
    });
    windows.openWindow(<AssetsWindow />, {
      ...SHARED_OPTIONS,
      id: "assets",
      title: "Assets",
    });
    windows.openWindow(<SessionSwitcherWindow />, {
      ...SHARED_OPTIONS,
      id: "sessions",
      title: "Other sessions",
      defaultDockState: "right",
    });
  }, [windows]);
}
