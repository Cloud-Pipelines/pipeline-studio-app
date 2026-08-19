import { useState } from "react";

/**
 * Auto-open while reasoning, auto-collapse once done — but preserve a manual
 * toggle until `done` flips again. The override remembers which `done` value
 * it applies to, so a change in `done` transparently falls back to the auto
 * behavior without needing a state-syncing effect.
 */
export function useThinkingCollapse(done: boolean) {
  const [override, setOverride] = useState<{
    open: boolean;
    done: boolean;
  } | null>(null);
  const open = override && override.done === done ? override.open : !done;
  const onOpenChange = (value: boolean) => setOverride({ open: value, done });
  return { open, onOpenChange };
}
