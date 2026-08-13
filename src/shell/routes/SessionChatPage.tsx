import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { BlockStack } from "@/components/ui/layout";
import { Section } from "@/components/ui/patterns/section";
import { Paragraph } from "@/components/ui/typography";
import { SessionChat } from "@/shell/features/chat/components/SessionChat";
import { useMarkSessionViewed } from "@/shell/features/sessions/hooks/useMarkSessionViewed";
import { useSession } from "@/shell/features/sessions/hooks/useSession";

export function SessionChatPage() {
  const { sessionId } = useParams({ strict: false }) as { sessionId: string };
  const { error } = useSession(sessionId);

  // Also mark viewed on leave, so messages that streamed in while open are seen.
  const { mutate: markViewed } = useMarkSessionViewed();
  useEffect(() => {
    markViewed(sessionId);
    return () => markViewed(sessionId);
  }, [sessionId, markViewed]);

  return (
    <BlockStack grow>
      {error ? (
        <Section tone="critical">
          <Paragraph size="sm" tone="critical">
            {error.message}
          </Paragraph>
        </Section>
      ) : (
        <SessionChat sessionId={sessionId} />
      )}
    </BlockStack>
  );
}
