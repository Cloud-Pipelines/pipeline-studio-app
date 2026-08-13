// local primitive — a closeable sub-agent tab in the SessionChat tab strip.
// Composes the Tabs primitive's TabsTrigger with an overlaid close button and a
// live status indicator; the raw <div>/<span>/<button> wrappers carry the
// scoped classNames needed to position the close affordance and truncate the
// name, which the Tangle primitives don't express on a Radix tab trigger.
import { Icon } from "@/components/ui/icon";
import { TabsTrigger } from "@/components/ui/tabs";

import { AgentStatusIndicator } from "../sidebar/agents/AgentStatusIndicator";

interface AgentTabTriggerProps {
  value: string;
  name: string;
  /** Session the sub-agent belongs to; keys its shared live status. */
  sessionId: string;
  /** The sub-agent's id, used to read its shared live status. */
  agentId: string;
  onClose: () => void;
}

export function AgentTabTrigger({
  value,
  name,
  sessionId,
  agentId,
  onClose,
}: AgentTabTriggerProps) {
  return (
    <div className="relative inline-flex items-center">
      <TabsTrigger value={value} className="max-w-44 pr-7">
        <Icon name="Bot" size="xs" tone="subdued" />
        <span className="min-w-0 truncate">{name}</span>
        <AgentStatusIndicator sessionId={sessionId} agentId={agentId} />
      </TabsTrigger>
      <button
        type="button"
        aria-label={`Close ${name}`}
        title={`Close ${name}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-1.5 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon name="X" size="xs" />
      </button>
    </div>
  );
}
