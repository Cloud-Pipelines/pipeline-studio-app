import { useQuery } from "@tanstack/react-query";

import type { SubagentStatus } from "@/shell/contracts";
import {
  type AgentLiveStatus,
  AgentStatusQueryKeys,
  IDLE_AGENT_STATUS,
} from "@/shell/features/chat/model/agentStatusQueryKeys";

const LIFECYCLE_LABELS: Record<SubagentStatus, string> = {
  active: "Ready",
  completed: "Completed",
  killed: "Killed",
  error: "Error",
};

/** Maps a live status to a short human explanation of what the agent is doing. */
function statusLabel({ status, busy, activity }: AgentLiveStatus): string {
  if (activity) return activity.label;
  if (busy) return "Responding...";
  return LIFECYCLE_LABELS[status];
}

/**
 * Reads an agent's live status (lifecycle + busy + activity) from the shared
 * React Query cache that {@link useSessionChat} publishes, and derives a short
 * human-readable label. Because every consumer reads the same `(sessionId,
 * agentId)` cache entry, all instances for one agent render identical state and
 * it survives a page reload (the server replays the current activity on join).
 */
export function useAgentStatus(
  sessionId: string,
  agentId: string,
): AgentLiveStatus & { label: string } {
  const { data } = useQuery({
    queryKey: AgentStatusQueryKeys.Detail(sessionId, agentId),
    // No fetch: the value is pushed via setQueryData from the session socket.
    // `staleTime: Infinity` keeps this fallback from clobbering pushed updates.
    queryFn: () => IDLE_AGENT_STATUS,
    staleTime: Infinity,
  });
  const live = data ?? IDLE_AGENT_STATUS;
  return { ...live, label: statusLabel(live) };
}
