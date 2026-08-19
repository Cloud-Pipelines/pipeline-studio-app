import { useNavigate } from "@tanstack/react-router";

import { APP_ROUTES } from "@/routes/appRoutes";
import { useSessions } from "@/shell/features/sessions/hooks/useSessions";

/**
 * Shared selection logic for the session switchers: the list of sessions other
 * than the current one and a navigate-on-select handler. Consumed by both the
 * list-style {@link SessionSwitcher} and the {@link SessionDropDownSwitcher}.
 */
export function useSessionSwitcher(currentSessionId: string) {
  const { data: allSessions } = useSessions();
  const navigate = useNavigate();

  // Archived sessions are hidden from the in-chat switcher.
  const sessions = allSessions?.filter((session) => !session.archived);
  const otherSessions = sessions?.filter(
    (session) => session.id !== currentSessionId,
  );

  const onSelect = (id: string) => {
    if (id === currentSessionId) return;
    void navigate({ to: APP_ROUTES.SHELL_SESSION, params: { sessionId: id } });
  };

  // Deleting the session currently being viewed leaves nowhere to stay, so
  // fall back to the sessions index.
  const onDeleted = (id: string) => {
    if (id !== currentSessionId) return;
    void navigate({ to: APP_ROUTES.SHELL });
  };

  return { sessions, otherSessions, onSelect, onDeleted };
}
