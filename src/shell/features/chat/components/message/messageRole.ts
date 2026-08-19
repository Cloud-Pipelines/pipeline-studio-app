import type { ChatMessage } from "@/shell/features/chat/model/types";

/** The parenthetical role suffix for a message author, e.g. ` (sub-agent)`. */
export function roleLabelFor(message: ChatMessage): string {
  const isAgent = message.author.kind === "agent";
  const isSubagent = message.author.agentRole === "subagent";
  return isSubagent ? " (sub-agent)" : isAgent ? " (agent)" : "";
}
