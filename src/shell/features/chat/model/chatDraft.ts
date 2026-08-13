const DRAFT_KEY_PREFIX = "tangent-chat-draft";

/**
 * The localStorage key for a session+agent draft. Drafts are scoped per session
 * and per agent (Prime or a sub-agent) so each composer keeps its own text.
 */
function draftStorageKey(sessionId: string, agentId: string): string {
  return `${DRAFT_KEY_PREFIX}:${sessionId}:${agentId}`;
}

/** The persisted draft for a session+agent, or "" when none (or unavailable). */
export function readDraft(sessionId: string, agentId: string): string {
  try {
    return localStorage.getItem(draftStorageKey(sessionId, agentId)) ?? "";
  } catch {
    // localStorage can be unavailable (private mode, SSR); treat as no draft.
    return "";
  }
}

/**
 * Persists a draft for a session+agent. An empty/whitespace-only value removes
 * the key so a cleared composer leaves nothing behind.
 */
export function writeDraft(
  sessionId: string,
  agentId: string,
  value: string,
): void {
  if (value.trim().length === 0) {
    clearDraft(sessionId, agentId);
    return;
  }
  try {
    localStorage.setItem(draftStorageKey(sessionId, agentId), value);
  } catch {
    // Persistence is best-effort; ignore storage failures.
  }
}

/** Removes the persisted draft for a session+agent. */
export function clearDraft(sessionId: string, agentId: string): void {
  try {
    localStorage.removeItem(draftStorageKey(sessionId, agentId));
  } catch {
    // Persistence is best-effort; ignore storage failures.
  }
}
