import { useState } from "react";
import { Virtualizer } from "virtua";

import { Box } from "@/components/ui/box";
import { BlockStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Paragraph } from "@/components/ui/typography";
import type { AgentActivity } from "@/shell/contracts";
import { useChatScroll } from "@/shell/features/chat/hooks/useChatScroll";
import { isThinkingOnly } from "@/shell/features/chat/model/messageState";
import type { ChatMessage as ChatMessageType } from "@/shell/features/chat/model/types";

import { AgentActivityBubble } from "./AgentActivityBubble";
import { CollapsedMessageGroup } from "./CollapsedMessageGroup";
import { JumpToBottomButton } from "./JumpToBottomButton";
import { buildSegments } from "./messageSegments";
import { ShellChatMessage } from "./ShellChatMessage";

interface ShellChatMessageListProps {
  sessionId: string;
  messages: ChatMessageType[];
  currentAuthorId: string;
  /** Ephemeral agent activity for this thread, or null when idle/streaming. */
  activity?: AgentActivity | null;
  /** Whether the room's history snapshot has arrived; gates loader vs empty. */
  historyLoaded: boolean;
  /** Bundle this session was created from; enables `tangent-ui:` components. */
  bundleId?: string;
  /** Forwards a prompt composed by an interactive `tangent-ui:` component. */
  onSendPrompt?: (text: string) => void;
  /** Opens a browser-viewable "page" artifact in an in-app tab. */
  onOpenArtifact?: (url: string, title: string) => void;
  /** The set of currently pinned artifact paths, for chip pin state. */
  pinnedPaths?: Set<string>;
  /** Toggles an artifact's pinned state from its chip. */
  onTogglePinArtifact?: (path: string, title: string) => void;
  /** Whether a given message id is still receiving streamed deltas. */
  isMessageStreaming: (messageId: string) => boolean;
}

// A single virtualized row: a visible message, a run of collapsed messages, or
// the trailing agent-activity bubble. Keys must be stable across renders so
// virtua's measurement cache survives streaming/collapse churn.
type Row =
  | { key: string; kind: "message"; message: ChatMessageType }
  | { key: string; kind: "collapsed"; messages: ChatMessageType[] }
  | { key: string; kind: "activity"; activity: AgentActivity };

const ACTIVITY_ROW_KEY = "__activity__";

interface RowContentProps {
  row: Row;
  sessionId: string;
  currentAuthorId: string;
  bundleId?: string;
  onSendPrompt?: (text: string) => void;
  onOpenArtifact?: (url: string, title: string) => void;
  pinnedPaths?: Set<string>;
  onTogglePinArtifact?: (path: string, title: string) => void;
  isMessageStreaming: (messageId: string) => boolean;
  onCollapse: (id: string) => void;
  onExpand: (ids: string[]) => void;
}

function RowContent({
  row,
  sessionId,
  currentAuthorId,
  bundleId,
  onSendPrompt,
  onOpenArtifact,
  pinnedPaths,
  onTogglePinArtifact,
  isMessageStreaming,
  onCollapse,
  onExpand,
}: RowContentProps) {
  switch (row.kind) {
    case "message":
      return (
        <ShellChatMessage
          sessionId={sessionId}
          message={row.message}
          isOwn={row.message.author.id === currentAuthorId}
          bundleId={bundleId}
          onSendPrompt={onSendPrompt}
          onOpenArtifact={onOpenArtifact}
          pinnedPaths={pinnedPaths}
          onTogglePinArtifact={onTogglePinArtifact}
          isStreaming={isMessageStreaming(row.message.id)}
          onCollapse={() => onCollapse(row.message.id)}
        />
      );
    case "collapsed":
      return (
        <CollapsedMessageGroup
          count={row.messages.length}
          onExpandAll={() => onExpand(row.messages.map((m) => m.id))}
        />
      );
    case "activity":
      return <AgentActivityBubble activity={row.activity} />;
  }
}

// Shown in place of the list when there are no rows: a loader until the room's
// history snapshot arrives, then the true empty-thread prompt.
function EmptyThread({ historyLoaded }: { historyLoaded: boolean }) {
  if (!historyLoaded) {
    return (
      <BlockStack fill>
        <Spinner size={20} />
      </BlockStack>
    );
  }
  return (
    <Box paddingBlock="base">
      <Paragraph size="sm" tone="subdued">
        No messages yet. Say hello to start the session.
      </Paragraph>
    </Box>
  );
}

export function ShellChatMessageList({
  sessionId,
  messages,
  currentAuthorId,
  activity,
  historyLoaded,
  bundleId,
  onSendPrompt,
  onOpenArtifact,
  pinnedPaths,
  onTogglePinArtifact,
  isMessageStreaming,
}: ShellChatMessageListProps) {
  // Collapse state is ephemeral per view (not URL or server). Thinking-only
  // messages collapse by default once they finish streaming; `expandedIds`
  // records the user overriding that default, while `collapsedIds` records the
  // user collapsing a message that would otherwise be visible. Consecutive
  // collapsed ids are grouped at render time into a "<n> messages hidden" row.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isCollapsed = (message: ChatMessageType) => {
    if (expandedIds.has(message.id)) return false;
    if (collapsedIds.has(message.id)) return true;
    return isThinkingOnly(message) && !isMessageStreaming(message.id);
  };

  const collapse = (id: string) => {
    setCollapsedIds((prev) => new Set(prev).add(id));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const expand = (ids: string[]) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  // Flatten segments (plus the trailing activity bubble) into one stably-keyed
  // index space for virtua.
  const rows: Row[] = [];
  for (const segment of buildSegments(messages, isCollapsed)) {
    if (segment.kind === "visible") {
      rows.push({
        key: segment.message.id,
        kind: "message",
        message: segment.message,
      });
    } else {
      rows.push({
        key: segment.messages[0].id,
        kind: "collapsed",
        messages: segment.messages,
      });
    }
  }
  if (activity) {
    rows.push({ key: ACTIVITY_ROW_KEY, kind: "activity", activity });
  }
  const {
    containerRef,
    virtualizerRef,
    onScroll,
    showJump,
    unreadCount,
    jumpToBottom,
  } = useChatScroll({ messages, currentAuthorId, rowCount: rows.length });

  // The scroll container is always rendered so its ref exists on mount and the
  // hook can attach its ResizeObserver and gesture listeners; otherwise
  // streaming growth on an initially empty thread wouldn't autoscroll once the
  // first message arrives.
  return (
    <BlockStack grow>
      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div
          ref={containerRef}
          className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto px-3 [overflow-anchor:none]"
        >
          {rows.length === 0 ? (
            <EmptyThread historyLoaded={historyLoaded} />
          ) : (
            <Virtualizer ref={virtualizerRef} onScroll={onScroll}>
              {rows.map((row, index) => {
                const isLast = index === rows.length - 1;
                return (
                  <Box
                    key={row.key}
                    paddingBlockStart={index === 0 ? "base" : undefined}
                    paddingBlockEnd={isLast ? "base" : "lg"}
                  >
                    <RowContent
                      row={row}
                      sessionId={sessionId}
                      currentAuthorId={currentAuthorId}
                      bundleId={bundleId}
                      onSendPrompt={onSendPrompt}
                      onOpenArtifact={onOpenArtifact}
                      pinnedPaths={pinnedPaths}
                      onTogglePinArtifact={onTogglePinArtifact}
                      isMessageStreaming={isMessageStreaming}
                      onCollapse={collapse}
                      onExpand={expand}
                    />
                  </Box>
                );
              })}
            </Virtualizer>
          )}
        </div>
        {showJump ? (
          <JumpToBottomButton
            unreadCount={unreadCount}
            onClick={jumpToBottom}
          />
        ) : null}
      </div>
    </BlockStack>
  );
}
