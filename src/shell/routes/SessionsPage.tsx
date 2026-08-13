import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import { PageHeader } from "@/components/ui/patterns/page-header";
import { WorkArea } from "@/components/ui/patterns/work-area";
import { Paragraph } from "@/components/ui/typography";
import { APP_ROUTES } from "@/routes/appRoutes";
import type { Session } from "@/shell/contracts";
import { useAgentBundles } from "@/shell/features/agent-bundles/hooks/useAgentBundles";
import { useCreateSession } from "@/shell/features/sessions/hooks/useCreateSession";
import { useSessions } from "@/shell/features/sessions/hooks/useSessions";
import { env } from "@/shell/lib/env";

import { NewSessionButton } from "./components/NewSessionButton";
import { SessionsTable } from "./components/SessionsTable";

export function SessionsPage() {
  const { data: sessions, isLoading, error } = useSessions();
  const { data: bundles } = useAgentBundles();
  const {
    mutate: createSession,
    isPending: isCreating,
    isError: isCreateError,
    error: createError,
  } = useCreateSession();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const archivedCount = sessions?.filter((s) => s.archived).length ?? 0;
  const visibleSessions = showArchived
    ? sessions
    : sessions?.filter((session) => !session.archived);
  const defaultBundle = bundles?.find(
    (bundle) => bundle.id === env.defaultSessionBundleId,
  );
  const defaultBundleName = defaultBundle?.name ?? env.defaultSessionBundleId;

  const openSession = (session: Session) =>
    void navigate({
      to: APP_ROUTES.SHELL_SESSION,
      params: { sessionId: session.id },
    });

  const startDefaultBundle = () =>
    createSession(
      { bundleId: env.defaultSessionBundleId, name: defaultBundleName },
      { onSuccess: openSession },
    );

  const startFromBundle = (bundleId: string, name: string) =>
    createSession({ bundleId, name }, { onSuccess: openSession });

  const newSessionButton = (
    <NewSessionButton
      bundles={bundles}
      creating={isCreating}
      onStartDefaultBundle={startDefaultBundle}
      onStartFromBundle={startFromBundle}
    />
  );

  return (
    <WorkArea>
      <BlockStack gap="6">
        <PageHeader
          title="Sessions"
          description="Conversations with your agents. Start with the default bundle, choose another bundle, or resume where you left off."
        />

        {error ? (
          <Paragraph size="sm" tone="critical">
            Failed to load sessions: {error.message}
          </Paragraph>
        ) : null}

        {isCreateError ? (
          <Paragraph size="sm" tone="critical">
            Failed to create session: {createError.message}
          </Paragraph>
        ) : null}

        {isLoading ? (
          <Paragraph size="sm" tone="subdued">
            Loading sessions...
          </Paragraph>
        ) : null}

        {sessions && sessions.length === 0 ? (
          <EmptyState
            icon="FolderOpen"
            title="No sessions yet"
            description="Start with the default bundle or choose another agent bundle to get started."
            action={newSessionButton}
          />
        ) : null}

        {sessions && sessions.length > 0 ? (
          <BlockStack gap="2">
            {archivedCount > 0 ? (
              <InlineStack gap="2" blockAlign="center">
                <Checkbox
                  id="sessions-show-archived"
                  checked={showArchived}
                  onCheckedChange={(checked) =>
                    setShowArchived(checked === true)
                  }
                />
                <Label htmlFor="sessions-show-archived">
                  Show archived ({archivedCount})
                </Label>
              </InlineStack>
            ) : null}
            <SessionsTable
              sessions={visibleSessions ?? []}
              onOpen={openSession}
            />
            {newSessionButton}
          </BlockStack>
        ) : null}
      </BlockStack>
    </WorkArea>
  );
}
