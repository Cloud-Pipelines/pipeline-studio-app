import { cva } from "class-variance-authority";

import { Icon } from "@/components/ui/icon";
import type { AgentRole } from "@/shell/features/chat/model/types";
import { cn } from "@/shell/lib/utils";

// Role-keyed avatar styling. The `agent`/`subagent` roles reuse the same
// `message-surface` tokens as the agent `ShellMessageBubble`, so a theme can
// fine-tune those colors in one place and the badge follows the bubble.
const messageAvatarVariants = cva(
  "flex size-6 shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      role: {
        human: "bg-secondary text-secondary-foreground",
        agent:
          "bg-message-surface text-message-surface-foreground border border-message-surface-border",
        subagent:
          "bg-message-surface text-message-surface-foreground border border-message-surface-border",
      },
    },
    defaultVariants: {
      role: "human",
    },
  },
);

type MessageAvatarRole = "human" | "agent" | "subagent";

function avatarRole(
  kind: "human" | "agent",
  agentRole?: AgentRole,
): MessageAvatarRole {
  if (kind !== "agent") return "human";
  return agentRole === "subagent" ? "subagent" : "agent";
}

const AVATAR_ICONS: Record<MessageAvatarRole, "User" | "Crown" | "Bot"> = {
  human: "User",
  agent: "Crown",
  subagent: "Bot",
};

interface MessageAvatarProps {
  kind: "human" | "agent";
  name: string;
  agentRole?: AgentRole;
}

/**
 * MessageAvatar — small circular badge conveying the message sender's kind
 * (human, prime agent, sub-agent). Styles a raw `<div>` (the sanctioned escape
 * hatch, like `StatusDot`/`UserAvatar`), so it is exempt from
 * tangle-ui/no-classname-on-primitives.
 */
export function MessageAvatar({ kind, name, agentRole }: MessageAvatarProps) {
  const role = avatarRole(kind, agentRole);
  return (
    <div
      title={name}
      aria-label={name}
      className={cn(messageAvatarVariants({ role }))}
    >
      <Icon name={AVATAR_ICONS[role]} size="xs" />
    </div>
  );
}
