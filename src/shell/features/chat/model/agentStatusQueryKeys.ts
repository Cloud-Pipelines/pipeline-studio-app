import type { AgentActivity, SubagentStatus } from "@/shell/contracts";

/**
 * An agent's live, render-ready status: its lifecycle (`status`), whether its
 * run is in flight (`busy`), and the current run-level `activity` (a running
 * tool or "thinking") when one is in progress. Published per agent into the
 * React Query cache by {@link useSessionChat} so multiple instances of the
 * status component for the same agent (sidebar card, tab trigger) share one
 * source of truth.
 */
export interface AgentLiveStatus {
  status: SubagentStatus;
  busy: boolean;
  activity: AgentActivity | null;
}

/** The status an agent reads as before any live update has been published. */
export const IDLE_AGENT_STATUS: AgentLiveStatus = {
  status: "active",
  busy: false,
  activity: null,
};

/**
 * Query keys for an agent's live status, following the SessionQueryKeys factory
 * pattern. Keyed by session and agent (`"prime"` or a sub-agent id).
 */
export const AgentStatusQueryKeys = {
  All: () => ["agentStatus"] as const,
  Session: (sessionId: string) => ["agentStatus", sessionId] as const,
  Detail: (sessionId: string, agentId: string) =>
    ["agentStatus", sessionId, agentId] as const,
} as const;
