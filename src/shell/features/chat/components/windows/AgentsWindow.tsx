import { AgentList } from "../sidebar/agents/AgentList";
import { useSessionChatWindowsContext } from "./SessionChatWindowsContext";

export function AgentsWindow() {
  const { agents, sessionId, selectedAgentId, onOpenAgent, onRemoveAgent } =
    useSessionChatWindowsContext();

  return (
    <AgentList
      agents={agents}
      sessionId={sessionId}
      selectedId={selectedAgentId}
      onOpen={onOpenAgent}
      onRemove={onRemoveAgent}
    />
  );
}
