import type {
  AgentActivity,
  Attachment,
  MessageDelivery,
  SubagentInfo,
  Trigger,
} from "@/shell/contracts";
import type { AssetTab } from "@/shell/features/chat/hooks/useAssetTabs";
import type { AgentModelSelection } from "@/shell/features/chat/hooks/useSessionChat";
import type { ChatMessage } from "@/shell/features/chat/model/types";

import { ArtifactTabView } from "./ArtifactTabView";
import { SubagentTabView } from "./SubagentTabView";
import { TriggerTabPanel } from "./TriggerTabPanel";

interface AssetTabContentProps {
  tab: AssetTab;
  sessionId: string;
  subagents: SubagentInfo[];
  triggers: Trigger[];
  messages: ChatMessage[];
  currentAuthorId: string;
  bundleId?: string;
  connected: boolean;
  historyLoaded: boolean;
  pinnedPaths: Set<string>;
  getActivity: (conversationId: string) => AgentActivity | null;
  isConversationBusy: (conversationId: string) => boolean;
  isMessageStreaming: (messageId: string) => boolean;
  getAgentModel: (agentId: string) => AgentModelSelection | null;
  setAgentModel: (agentId: string, selection: AgentModelSelection) => void;
  abort: (conversationId: string) => void;
  dismissSubagent: (id: string) => void;
  closeAsset: (id: string) => void;
  send: (
    content: string,
    options?: {
      conversationId?: string;
      delivery?: MessageDelivery;
      attachments?: Attachment[];
    },
  ) => void;
  openArtifactTab: (url: string, title: string) => void;
  togglePinArtifact: (path: string, title: string) => void;
}

/**
 * Renders the body of an opened asset tab, dispatching by `tab.kind` to the
 * matching per-type view. `SessionChat` owns the surrounding `TabsContent`; this
 * component only resolves and renders the right view for the tab.
 */
export function AssetTabContent({
  tab,
  sessionId,
  subagents,
  triggers,
  messages,
  currentAuthorId,
  bundleId,
  connected,
  historyLoaded,
  pinnedPaths,
  getActivity,
  isConversationBusy,
  isMessageStreaming,
  getAgentModel,
  setAgentModel,
  abort,
  dismissSubagent,
  closeAsset,
  send,
  openArtifactTab,
  togglePinArtifact,
}: AssetTabContentProps) {
  switch (tab.kind) {
    case "agent": {
      const info = subagents.find((s) => s.id === tab.agentId);
      const model = getAgentModel(tab.agentId);
      return (
        <SubagentTabView
          sessionId={sessionId}
          agentId={tab.agentId}
          name={info?.name ?? tab.title}
          messages={messages}
          currentAuthorId={currentAuthorId}
          bundleId={bundleId}
          historyLoaded={historyLoaded}
          activity={getActivity(tab.agentId)}
          status={info?.status ?? "completed"}
          busy={isConversationBusy(tab.agentId)}
          disabled={!connected}
          isMessageStreaming={isMessageStreaming}
          model={model?.model}
          thinkingDepth={model?.thinkingDepth}
          onSetModel={(selection) => setAgentModel(tab.agentId, selection)}
          onAbort={() => abort(tab.agentId)}
          onRemove={() => {
            dismissSubagent(tab.agentId);
            closeAsset(tab.id);
          }}
          onSubmit={(content, { delivery, attachments }) =>
            send(content, {
              conversationId: tab.agentId,
              delivery,
              attachments,
            })
          }
          onOpenArtifact={openArtifactTab}
          pinnedPaths={pinnedPaths}
          onTogglePinArtifact={togglePinArtifact}
        />
      );
    }
    case "trigger":
      return (
        <TriggerTabPanel
          sessionId={sessionId}
          triggerId={tab.triggerId}
          triggers={triggers}
          onClose={() => closeAsset(tab.id)}
        />
      );
    default:
      return (
        <ArtifactTabView
          sessionId={sessionId}
          url={tab.url}
          title={tab.title}
          onSendPrompt={(content, attachments) =>
            send(content, { attachments })
          }
        />
      );
  }
}
