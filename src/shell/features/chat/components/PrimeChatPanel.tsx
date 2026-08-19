import { Box } from "@/components/ui/box";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import {
  type AgentActivity,
  type Attachment,
  type MemorySuggestionPayload,
  type MessageDelivery,
  PI_AGENT,
  type SubagentInfo,
  type Trigger,
} from "@/shell/contracts";
import type { AgentModelSelection } from "@/shell/features/chat/hooks/useSessionChat";
import type { Asset } from "@/shell/features/chat/model/assets";
import type { ChatMessage } from "@/shell/features/chat/model/types";

import { ActiveTasksIndicator } from "./composer/ActiveTasksIndicator";
import { AgentModelPicker } from "./composer/AgentModelPicker";
import { MemorySuggestionCard } from "./composer/MemorySuggestionCard";
import { ShellChatInput } from "./composer/ShellChatInput";
import { ShellChatMessageList } from "./message/ShellChatMessageList";

type SendFn = (
  content: string,
  options?: {
    conversationId?: string;
    delivery?: MessageDelivery;
    attachments?: Attachment[];
  },
) => void;

interface PrimeChatPanelProps {
  sessionId: string;
  messages: ChatMessage[];
  currentAuthorId: string;
  bundleId?: string;
  connected: boolean;
  historyLoaded: boolean;
  agentBusy: boolean;
  activity: AgentActivity | null;
  isMessageStreaming: (messageId: string) => boolean;
  memorySuggestions: MemorySuggestionPayload[];
  confirmMemory: (suggestionId: string) => void;
  dismissMemory: (suggestionId: string) => void;
  busySubagents: { id: string; name: string }[];
  armedTriggers: Trigger[];
  subagents: SubagentInfo[];
  assets: Asset[];
  primeModel: AgentModelSelection | null;
  send: SendFn;
  abort: (conversationId: string) => void;
  openAgent: (agent: { id: string; name: string }) => void;
  openAsset: (asset: Asset) => void;
  setAgentModel: (agentId: string, selection: AgentModelSelection) => void;
  openArtifactTab: (url: string, title: string) => void;
  pinnedPaths: Set<string>;
  togglePinArtifact: (path: string, title: string) => void;
}

export function PrimeChatPanel({
  sessionId,
  messages,
  currentAuthorId,
  bundleId,
  connected,
  historyLoaded,
  agentBusy,
  activity,
  isMessageStreaming,
  memorySuggestions,
  confirmMemory,
  dismissMemory,
  busySubagents,
  armedTriggers,
  subagents,
  assets,
  primeModel,
  send,
  abort,
  openAgent,
  openAsset,
  setAgentModel,
  openArtifactTab,
  pinnedPaths,
  togglePinArtifact,
}: PrimeChatPanelProps) {
  return (
    <BlockStack grow>
      <ShellChatMessageList
        sessionId={sessionId}
        messages={messages}
        currentAuthorId={currentAuthorId}
        activity={activity}
        historyLoaded={historyLoaded}
        bundleId={bundleId}
        onSendPrompt={send}
        onOpenArtifact={openArtifactTab}
        pinnedPaths={pinnedPaths}
        onTogglePinArtifact={togglePinArtifact}
        isMessageStreaming={isMessageStreaming}
      />
      {memorySuggestions.length > 0 && (
        <Box paddingInline="base" paddingBlock="sm">
          <BlockStack gap="2">
            {memorySuggestions.map((suggestion) => (
              <MemorySuggestionCard
                key={suggestion.suggestionId}
                suggestion={suggestion}
                onConfirm={confirmMemory}
                onDismiss={dismissMemory}
              />
            ))}
          </BlockStack>
        </Box>
      )}
      <PrimeComposerFooter
        sessionId={sessionId}
        busySubagents={busySubagents}
        armedTriggers={armedTriggers}
        subagents={subagents}
        assets={assets}
        connected={connected}
        primeModel={primeModel}
        openAgent={openAgent}
        openAsset={openAsset}
        abort={abort}
        setAgentModel={setAgentModel}
      />
      <ShellChatInput
        key={`${sessionId}:${PI_AGENT.id}`}
        sessionId={sessionId}
        agentId={PI_AGENT.id}
        disabled={!connected}
        agentBusy={agentBusy}
        onAbort={() => abort(PI_AGENT.id)}
        onSubmit={(content, { delivery, attachments }) =>
          send(content, {
            conversationId: PI_AGENT.id,
            delivery,
            attachments,
          })
        }
      />
    </BlockStack>
  );
}

interface PrimeComposerFooterProps {
  sessionId: string;
  busySubagents: { id: string; name: string }[];
  armedTriggers: Trigger[];
  subagents: SubagentInfo[];
  assets: Asset[];
  connected: boolean;
  primeModel: AgentModelSelection | null;
  openAgent: (agent: { id: string; name: string }) => void;
  openAsset: (asset: Asset) => void;
  abort: (conversationId: string) => void;
  setAgentModel: (agentId: string, selection: AgentModelSelection) => void;
}

function PrimeComposerFooter({
  sessionId,
  busySubagents,
  armedTriggers,
  subagents,
  assets,
  connected,
  primeModel,
  openAgent,
  openAsset,
  abort,
  setAgentModel,
}: PrimeComposerFooterProps) {
  return (
    <Box paddingInline="base" paddingBlock="sm">
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack blockAlign="center">
          <ActiveTasksIndicator
            sessionId={sessionId}
            busySubagents={busySubagents}
            armedTriggers={armedTriggers}
            onOpenAgent={(id) =>
              openAgent({
                id,
                name: subagents.find((s) => s.id === id)?.name ?? id,
              })
            }
            onAbort={abort}
            onOpenTrigger={(id) => {
              const asset = assets.find(
                (a) => a.kind === "trigger" && a.id === id,
              );
              if (asset) openAsset(asset);
            }}
          />
        </InlineStack>
        <AgentModelPicker
          model={primeModel?.model}
          thinkingDepth={primeModel?.thinkingDepth}
          onChange={(selection) => setAgentModel(PI_AGENT.id, selection)}
          disabled={!connected}
        />
      </InlineStack>
    </Box>
  );
}
