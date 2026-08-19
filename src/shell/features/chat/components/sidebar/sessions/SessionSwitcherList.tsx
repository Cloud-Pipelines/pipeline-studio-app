import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { HoverReveal } from "@/components/ui/patterns/hover-reveal";
import { ListRow } from "@/components/ui/patterns/list-row";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Text } from "@/components/ui/typography";
import type { Session } from "@/shell/contracts";
import { agentBundleIconUrl } from "@/shell/features/agent-bundles/api/agentBundlesApi";
import { SessionActionsMenu } from "@/shell/features/sessions/components/SessionActionsMenu";
import { SessionStatusIndicator } from "@/shell/features/sessions/components/SessionStatusIndicator";
import { BundleIconImage } from "@/shell/routes/components/bundle-grid";

interface SessionSwitcherListProps {
  sessions: Session[];
  onSelect: (id: string) => void;
  /** Highlighted row (keyboard navigation); scrolled into view when set. */
  selectedId?: string;
  /**
   * When provided, each row gets a hover-revealed actions menu (rename,
   * archive, delete) and this is called after a session is deleted. Omit it
   * (e.g. the dropdown switcher) to keep the list a plain quick-switch.
   */
  onDeleted?: (id: string) => void;
}

/**
 * Presentational list of selectable sessions shared by the list-style and
 * dropdown switcher variants.
 */
export function SessionSwitcherList({
  sessions,
  onSelect,
  selectedId,
  onDeleted,
}: SessionSwitcherListProps) {
  const selectedRef = useRef<HTMLElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <BlockStack as="ul" gap="1">
      {sessions.map((session) => (
        <ListRow
          key={session.id}
          ref={session.id === selectedId ? selectedRef : undefined}
          as="li"
          density="comfortable"
          gap="3"
          hoverable
          border="sm"
          selected={session.id === selectedId}
          onClick={() => onSelect(session.id)}
        >
          {session.config?.icon ? (
            <BundleIconImage
              size="sm"
              src={agentBundleIconUrl(session.config.id)}
              alt={`${session.config.name} icon`}
            />
          ) : (
            <Icon name="MessageSquare" size="lg" tone="subdued" />
          )}
          <BlockStack grow align="stretch">
            <Truncating>
              <Text
                as="p"
                size="xs"
                weight="medium"
                truncate
                title={session.name}
              >
                {session.name}
              </Text>
            </Truncating>
            {/* Live run status from the lobby socket. */}
            <SessionStatusIndicator sessionId={session.id} />
          </BlockStack>
          {onDeleted ? (
            <HoverReveal>
              <SessionActionsMenu session={session} onDeleted={onDeleted} />
            </HoverReveal>
          ) : null}
        </ListRow>
      ))}
    </BlockStack>
  );
}
