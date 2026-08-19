import { SessionSwitcher } from "../sidebar/sessions/SessionSwitcher";
import { useSessionChatWindowsContext } from "./SessionChatWindowsContext";

export function SessionSwitcherWindow() {
  const { sessionId } = useSessionChatWindowsContext();

  return <SessionSwitcher currentSessionId={sessionId} />;
}
