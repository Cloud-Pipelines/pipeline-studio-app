import { useEffect, useState } from "react";

import { useSessionTabStore } from "@/shell/features/chat/hooks/useSessionTabStore";
import type { Asset } from "@/shell/features/chat/model/assets";

/**
 * A single opened tab in the SessionChat tab strip. Carries the `kind` so
 * SessionChat can dispatch to the matching per-type TabView, plus the minimal
 * payload each view needs. Deduped (and keyed) by `id`.
 *
 * Sub-agent tabs are opened on demand (one closeable tab per sub-agent, keyed
 * by the sub-agent id); their live status/name is resolved against the roster
 * when rendered. Prime is not tracked here: it is the fixed chat tab.
 */
export type AssetTab =
  | { id: string; kind: "page" | "file"; title: string; url: string }
  | { id: string; kind: "trigger"; title: string; triggerId: string }
  | { id: string; kind: "agent"; title: string; agentId: string };

/** The fixed, non-closeable chat tab's value (Prime's main thread). */
export const CHAT_TAB_VALUE = "chat";

/** Maps an {@link Asset} to the tab payload SessionChat keeps open for it. */
function toTab(asset: Asset): AssetTab {
  if (asset.kind === "trigger") {
    return {
      id: asset.id,
      kind: "trigger",
      title: asset.title,
      triggerId: asset.trigger.id,
    };
  }
  return { id: asset.id, kind: asset.kind, title: asset.title, url: asset.url };
}

/**
 * Owns the SessionChat asset tab strip: a closeable tab per opened asset (the
 * fixed chat tab and the per-sub-agent tabs are rendered separately by
 * SessionChat). Opening an already-open asset just focuses its tab; closing the
 * active tab falls back to chat.
 */
export function useAssetTabs(sessionId: string) {
  const store = useSessionTabStore();
  const [tabs, setTabs] = useState<AssetTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>(CHAT_TAB_VALUE);
  const [seenSessionId, setSeenSessionId] = useState(sessionId);

  // Switching sessions reuses this hook instance, so restore the incoming
  // session's remembered tabs (the outgoing session's were saved by the effect
  // below), falling back to just the chat tab for a session we haven't opened.
  if (seenSessionId !== sessionId) {
    setSeenSessionId(sessionId);
    const restored = store.read(sessionId);
    setTabs(restored?.tabs ?? []);
    setActiveTab(restored?.activeTab ?? CHAT_TAB_VALUE);
  }

  useEffect(() => {
    store.write(sessionId, { tabs, activeTab });
  }, [store, sessionId, tabs, activeTab]);

  function openTab(tab: AssetTab) {
    setTabs((prev) =>
      prev.some((existing) => existing.id === tab.id) ? prev : [...prev, tab],
    );
    setActiveTab(tab.id);
  }

  function openAsset(asset: Asset) {
    openTab(toTab(asset));
  }

  /**
   * Opens (or focuses) a sub-agent's thread tab. Keyed by the sub-agent id so
   * reopening the same agent just focuses its existing tab.
   */
  function openAgent(agent: { id: string; name: string }) {
    openTab({
      id: agent.id,
      kind: "agent",
      title: agent.name,
      agentId: agent.id,
    });
  }

  function closeAsset(id: string) {
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    setActiveTab((prev) => (prev === id ? CHAT_TAB_VALUE : prev));
  }

  return { tabs, activeTab, setActiveTab, openAsset, openAgent, closeAsset };
}
