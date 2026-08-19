import type { SubagentInfo } from "@/shell/contracts";
import type { AssetTab } from "@/shell/features/chat/hooks/useAssetTabs";

import { AgentTabTrigger } from "./AgentTabTrigger";
import { AssetTabTrigger } from "./AssetTabTrigger";

interface OpenedTabTriggerProps {
  tab: AssetTab;
  sessionId: string;
  subagents: SubagentInfo[];
  onClose: () => void;
}

/**
 * A single closeable tab in the SessionChat tab strip, dispatched by `tab.kind`:
 * sub-agent tabs carry a live status indicator ({@link AgentTabTrigger}), while
 * asset tabs show a type icon ({@link AssetTabTrigger}).
 */
export function OpenedTabTrigger({
  tab,
  sessionId,
  subagents,
  onClose,
}: OpenedTabTriggerProps) {
  switch (tab.kind) {
    case "agent": {
      const info = subagents.find((s) => s.id === tab.agentId);
      return (
        <AgentTabTrigger
          value={tab.id}
          name={info?.name ?? tab.title}
          sessionId={sessionId}
          agentId={tab.agentId}
          onClose={onClose}
        />
      );
    }
    default:
      return (
        <AssetTabTrigger
          value={tab.id}
          title={tab.title}
          kind={tab.kind}
          onClose={onClose}
        />
      );
  }
}
