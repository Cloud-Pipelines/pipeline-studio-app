import {
  PI_AGENT,
  type SubagentInfo,
  type SubagentStatus,
} from "@/shell/contracts";

/**
 * A session agent surfaced in the sidebar as a card and openable in its own
 * in-app tab. Prime is always present and leads the list; sub-agents follow,
 * driven by the live roster. The leading icon conveys the kind; the trailing
 * status indicator reflects the agent's lifecycle.
 */
export interface Agent {
  /** Stable id; also the agent's `ChatAuthor.id` / conversation id. */
  id: string;
  name: string;
  kind: "prime" | "subagent";
  status: SubagentStatus;
}

/**
 * Projects the live sub-agent roster into a uniform list of {@link Agent}s with
 * Prime first. Prime has no lifecycle status of its own, so it reads as
 * `active`; busy state is derived at render via `isConversationBusy`.
 */
export function buildAgents(subagents: SubagentInfo[]): Agent[] {
  const prime: Agent = {
    id: PI_AGENT.id,
    name: PI_AGENT.name,
    kind: "prime",
    status: "active",
  };

  const subagentEntries: Agent[] = sortSubagents(subagents).map((subagent) => ({
    id: subagent.id,
    name: subagent.name,
    kind: "subagent",
    status: subagent.status,
  }));

  return [prime, ...subagentEntries];
}

// Active sub-agents float to the top so the live entries are easy to scan;
// ended ones (completed/killed/error) settle after, in their most recent order.
function sortSubagents(subagents: SubagentInfo[]): SubagentInfo[] {
  return [...subagents].sort((a, b) => {
    const aActive = a.status === "active" ? 0 : 1;
    const bActive = b.status === "active" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
