import type { SessionRunStatus } from "@/shell/contracts";

/** The `StatusDot` variants a session run status can map to. */
type SessionStatusVariant = "busy" | "active" | "disconnected";

/** Dot variant + human-readable label for a session's live run status. */
export interface SessionStatusDisplay {
  variant: SessionStatusVariant;
  label: string;
}

/** Maps a run status to its dot variant and label, shared by every view that
 * renders session status (the switcher list, sessions table, session header). */
export const SESSION_STATUS_DISPLAY: Record<
  SessionRunStatus,
  SessionStatusDisplay
> = {
  idle: { variant: "disconnected", label: "Idle" },
  active: { variant: "active", label: "Active" },
  busy: { variant: "busy", label: "Busy" },
};
