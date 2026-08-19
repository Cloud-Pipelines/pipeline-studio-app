import { createContext, useContext } from "react";

import type { SessionRunStatus } from "@/shell/contracts";

/**
 * Live run status per session, keyed by session id. Seeded from the lobby
 * snapshot and kept current by `session:status` broadcasts. A session absent
 * from the map is `idle` (no Pi process running).
 */
export type SessionStatusMap = ReadonlyMap<string, SessionRunStatus>;

/** Defaults to an empty map so consumers rendered outside the provider (or
 * before the socket connects) simply read every session as `idle`. */
export const SessionStatusContext = createContext<SessionStatusMap>(new Map());

/** The live run status for a session, defaulting to `idle` when unknown. */
export function useSessionStatus(sessionId: string): SessionRunStatus {
  return useContext(SessionStatusContext).get(sessionId) ?? "idle";
}
