import { Box } from "@/components/ui/box";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import type {
  AgentActivity,
  Attachment,
  MessageDelivery,
  SubagentStatus,
  ThinkingLevel,
} from "@/shell/contracts";
import type { ChatMessage } from "@/shell/features/chat/model/types";

import {
  AgentModelPicker,
  type AgentModelPickerValue,
} from "../composer/AgentModelPicker";
import { ShellChatInput } from "../composer/ShellChatInput";
import { ShellChatMessageList } from "../message/ShellChatMessageList";

interface SubagentTabViewProps {
  sessionId: string;
  /** The sub-agent (and conversation) this tab is dedicated to. */
  agentId: string;
  /** Display name, used in the stop control's label. */
  name: string;
  /** All chat messages; filtered to this sub-agent's conversation. */
  messages: ChatMessage[];
  currentAuthorId: string;
  /** Bundle this session was created from; enables `tangent-ui:` components. */
  bundleId?: string;
  /** Whether the room's history snapshot has arrived; gates loader vs empty. */
  historyLoaded: boolean;
  activity: AgentActivity | null;
  /** This sub-agent's lifecycle status; a `"killed"` agent hides its composer. */
  status: SubagentStatus;
  /** Whether this sub-agent's run is in flight. */
  busy: boolean;
  /** Disables the composer (e.g. while the socket is disconnected). */
  disabled?: boolean;
  isMessageStreaming: (messageId: string) => boolean;
  /** Aborts this sub-agent's in-progress run. */
  onAbort: () => void;
  /** Removes this (killed) sub-agent from the roster and closes its tab. */
  onRemove: () => void;
  /** Sends (or nudges) a message to this sub-agent's thread. */
  onSubmit: (
    content: string,
    options: { delivery: MessageDelivery; attachments?: Attachment[] },
  ) => void;
  /** This sub-agent's current model id (absent = server default). */
  model?: string;
  /** This sub-agent's current thinking depth (absent = server default). */
  thinkingDepth?: ThinkingLevel;
  /** Changes this sub-agent's model and/or thinking depth. */
  onSetModel: (selection: AgentModelPickerValue) => void;
  /** Opens a browser-viewable artifact referenced in a message. */
  onOpenArtifact: (url: string, title: string) => void;
  pinnedPaths: Set<string>;
  onTogglePinArtifact: (path: string, title: string) => void;
}

/**
 * A single sub-agent's thread, shown in its own in-app tab. Users can steer or
 * follow-up a sub-agent directly here (mirroring the Prime composer) while its
 * run is in flight, or message it when idle.
 */
export function SubagentTabView({
  sessionId,
  agentId,
  messages,
  currentAuthorId,
  bundleId,
  historyLoaded,
  activity,
  status,
  busy,
  disabled,
  isMessageStreaming,
  onAbort,
  onSubmit,
  model,
  thinkingDepth,
  onSetModel,
  onOpenArtifact,
  onRemove,
  pinnedPaths,
  onTogglePinArtifact,
}: SubagentTabViewProps) {
  const visibleMessages = messages.filter((m) => m.conversationId === agentId);

  return (
    <BlockStack grow>
      <ShellChatMessageList
        sessionId={sessionId}
        messages={visibleMessages}
        currentAuthorId={currentAuthorId}
        activity={activity}
        historyLoaded={historyLoaded}
        bundleId={bundleId}
        onOpenArtifact={onOpenArtifact}
        pinnedPaths={pinnedPaths}
        onTogglePinArtifact={onTogglePinArtifact}
        isMessageStreaming={isMessageStreaming}
      />
      <Box paddingInline="base" paddingBlock="sm">
        <InlineStack align="end">
          <AgentModelPicker
            model={model}
            thinkingDepth={thinkingDepth}
            onChange={onSetModel}
            disabled={disabled}
          />
        </InlineStack>
      </Box>
      <ShellChatInput
        key={`${sessionId}:${agentId}`}
        sessionId={sessionId}
        agentId={agentId}
        disabled={disabled}
        agentBusy={busy}
        agentStatus={status}
        onRemove={onRemove}
        onAbort={onAbort}
        onSubmit={onSubmit}
      />
    </BlockStack>
  );
}
