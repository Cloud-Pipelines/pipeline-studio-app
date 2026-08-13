import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedStoreProvider } from "@/routes/v2/shared/store/SharedStoreContext";
import { DockArea } from "@/routes/v2/shared/windows/DockArea";
import { WindowContainer } from "@/routes/v2/shared/windows/WindowContainer";
import { useWindowPersistence } from "@/routes/v2/shared/windows/windowPersistence";
import { PI_AGENT } from "@/shell/contracts";
import {
  CHAT_TAB_VALUE,
  useAssetTabs,
} from "@/shell/features/chat/hooks/useAssetTabs";
import { useSessionChat } from "@/shell/features/chat/hooks/useSessionChat";
import { type Agent, buildAgents } from "@/shell/features/chat/model/agents";
import { buildAssets } from "@/shell/features/chat/model/assets";
import { useSession } from "@/shell/features/sessions/hooks/useSession";
import { isViewableArtifact } from "@/shell/lib/markdown/artifact";

import { PrimeChatPanel } from "./PrimeChatPanel";
import { SessionCard } from "./sidebar/sessions/SessionCard";
import { AssetTabContent } from "./tabs/AssetTabContent";
import { OpenedTabTrigger } from "./tabs/OpenedTabTrigger";
import { SessionChatWindowsContext } from "./windows/SessionChatWindowsContext";
import { useSessionChatWindows } from "./windows/useSessionChatWindows";

interface SessionChatProps {
  sessionId: string;
}

export function SessionChat({ sessionId }: SessionChatProps) {
  const {
    messages,
    subagents,
    triggers,
    artifacts,
    pinnedPaths,
    pinArtifact,
    unpinArtifact,
    connected,
    memorySuggestions,
    confirmMemory,
    dismissMemory,
    historyLoaded,
    agentBusy,
    isConversationBusy,
    getActivity,
    isMessageStreaming,
    currentAuthorId,
    send,
    abort,
    getAgentModel,
    setAgentModel,
    dismissSubagent,
  } = useSessionChat(sessionId);

  // Prime's current model/thinking selection (null = server default).
  const primeModel = getAgentModel(PI_AGENT.id);

  // The bundle this session was created from (if any) drives both the
  // `tangent-ui:` message tokens and the composer's panel launcher.
  const { data: session } = useSession(sessionId);
  const bundleId = session?.config?.id;

  // Opened tabs (assets and sub-agent threads), each shown beside the chat in
  // its own closeable tab.
  const { tabs, activeTab, setActiveTab, openAsset, openAgent, closeAsset } =
    useAssetTabs(sessionId);

  // The session's pages, files, and triggers as one uniform list of cards.
  const assets = buildAssets({ sessionId, artifacts, triggers });

  // Prime first, then the live sub-agent roster, surfaced as sidebar cards.
  const agents = buildAgents(subagents);

  // The Chat tab is Prime's main thread; each sub-agent opens its own thread
  // tab on demand. Prime's card selects the fixed Chat tab; sub-agent cards
  // open (or focus) a closeable tab.
  const openAgentTab = (agent: Agent) => {
    if (agent.kind === "prime") {
      setActiveTab(CHAT_TAB_VALUE);
      return;
    }
    openAgent({ id: agent.id, name: agent.name });
  };

  // The Chat tab stands in for Prime's card, so map it back to Prime's id when
  // deciding which agent card reads as selected.
  const selectedAgentId =
    activeTab === CHAT_TAB_VALUE ? PI_AGENT.id : activeTab;

  // The Chat tab is Prime's main thread; each sub-agent has its own thread tab.
  const primeMessages = messages.filter(
    (m) => m.conversationId === PI_AGENT.id,
  );

  const busySubagents = subagents
    .filter((s) => isConversationBusy(s.id))
    .map((s) => ({ id: s.id, name: s.name }));
  const armedTriggers = triggers.filter((t) => t.enabled);

  // Opening an artifact from a chat chip mirrors opening it from the sidebar: a
  // viewable "page" asset keyed by its resolved URL, so both dedupe to one tab.
  const openArtifactTab = (url: string, title: string) => {
    openAsset({
      kind: isViewableArtifact(url) ? "page" : "file",
      id: url,
      title,
      url,
      path: url,
    });
  };

  // Pin an artifact if it isn't already pinned, else unpin it. The chip's
  // pinned state and the sidebar list both update via the `artifacts.update`
  // directive once the server confirms.
  const togglePinArtifact = (path: string, title: string) => {
    if (pinnedPaths.has(path)) {
      unpinArtifact(path);
    } else {
      pinArtifact(path, title);
    }
  };

  // The chat state every opened asset tab's body shares; forwarded as-is so
  // AssetTabContent can resolve and render the right per-kind view.
  const sharedTabProps = {
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
  };

  return (
    <SharedStoreProvider>
      <SessionChatWindowsContext
        value={{
          sessionId,
          agents,
          selectedAgentId,
          activeTab,
          assets,
          onOpenAgent: openAgentTab,
          onRemoveAgent: (agent) => {
            dismissSubagent(agent.id);
            closeAsset(agent.id);
          },
          onOpenAsset: openAsset,
          onUnpinArtifact: unpinArtifact,
        }}
      >
        <SessionChatWindowsMount />
        <BlockStack grow align="stretch">
          <SessionCard
            currentSessionId={sessionId}
            name={session?.name ?? "Session"}
            rootPath={session?.rootPath}
            connected={connected}
          />
          <InlineStack grow wrap="nowrap" blockAlign="stretch">
            <DockArea side="left" />
            <Tabs
              variant="panel"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value={CHAT_TAB_VALUE}>
                  <Icon name="MessageSquare" size="xs" tone="subdued" />
                  Chat
                </TabsTrigger>
                {tabs.map((tab) => (
                  <OpenedTabTrigger
                    key={tab.id}
                    tab={tab}
                    sessionId={sessionId}
                    subagents={subagents}
                    onClose={() => closeAsset(tab.id)}
                  />
                ))}
              </TabsList>

              <TabsContent value={CHAT_TAB_VALUE} forceMount>
                <PrimeChatPanel
                  sessionId={sessionId}
                  messages={primeMessages}
                  currentAuthorId={currentAuthorId}
                  bundleId={bundleId}
                  connected={connected}
                  historyLoaded={historyLoaded}
                  agentBusy={agentBusy}
                  activity={getActivity(PI_AGENT.id)}
                  isMessageStreaming={isMessageStreaming}
                  memorySuggestions={memorySuggestions}
                  confirmMemory={confirmMemory}
                  dismissMemory={dismissMemory}
                  busySubagents={busySubagents}
                  armedTriggers={armedTriggers}
                  subagents={subagents}
                  assets={assets}
                  primeModel={primeModel}
                  send={send}
                  abort={abort}
                  openAgent={openAgent}
                  openAsset={openAsset}
                  setAgentModel={setAgentModel}
                  openArtifactTab={openArtifactTab}
                  pinnedPaths={pinnedPaths}
                  togglePinArtifact={togglePinArtifact}
                />
              </TabsContent>

              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} forceMount>
                  <AssetTabContent tab={tab} {...sharedTabProps} />
                </TabsContent>
              ))}
            </Tabs>
            <DockArea side="right" />
          </InlineStack>
          <WindowContainer />
        </BlockStack>
      </SessionChatWindowsContext>
    </SharedStoreProvider>
  );
}

function SessionChatWindowsMount() {
  useWindowPersistence("session-chat");
  useSessionChatWindows();
  return null;
}
