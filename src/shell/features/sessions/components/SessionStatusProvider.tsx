import { useQueryClient } from "@tanstack/react-query";
import { type PropsWithChildren, useEffect, useState } from "react";
import { io } from "socket.io-client";

import {
  type SessionRunStatus,
  type SessionStatusPayload,
  type SessionStatusSnapshotPayload,
  SocketEvents,
} from "@/shell/contracts";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";
import {
  SessionStatusContext,
  type SessionStatusMap,
} from "@/shell/features/sessions/model/sessionStatusContext";
import { SHELL_API_ORIGIN, SHELL_SOCKET_PATH } from "@/shell/lib/basePath";

/**
 * Holds one shared socket subscribed to the sessions lobby and exposes every
 * session's live run status to the list views (the in-chat switcher and the
 * sessions table). Kept separate from the per-chat socket in `useSessionChat`
 * so list status works on any page, independent of which chat is open.
 */
export function SessionStatusProvider({ children }: PropsWithChildren) {
  const [statuses, setStatuses] = useState<SessionStatusMap>(() => new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    // Same connection style as `useSessionChat`; see `basePath.ts` for how the
    // shell backend is addressed in proxied vs. direct mode.
    const socket = io(SHELL_API_ORIGIN || undefined, {
      autoConnect: true,
      path: SHELL_SOCKET_PATH,
    });

    socket.on("connect", () => {
      // The snapshot repopulates state on (re)connect, so clear first.
      setStatuses(new Map());
      socket.emit(SocketEvents.SessionStatusSubscribe);
    });

    socket.on(
      SocketEvents.SessionStatusSnapshot,
      ({ statuses: snapshot }: SessionStatusSnapshotPayload) => {
        setStatuses(new Map(snapshot.map((s) => [s.sessionId, s.status])));
      },
    );

    socket.on(
      SocketEvents.SessionStatus,
      ({ sessionId, status }: SessionStatusPayload) => {
        setStatuses((prev) => upsertStatus(prev, sessionId, status));
        // A turn boundary usually means new messages; refresh list activity.
        void queryClient.invalidateQueries({
          queryKey: SessionQueryKeys.All(),
        });
      },
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <SessionStatusContext.Provider value={statuses}>
      {children}
    </SessionStatusContext.Provider>
  );
}

/** Returns a new map with `sessionId` set to `status` (or removed when idle). */
function upsertStatus(
  prev: SessionStatusMap,
  sessionId: string,
  status: SessionRunStatus,
): SessionStatusMap {
  const next = new Map(prev);
  if (status === "idle") {
    next.delete(sessionId);
  } else {
    next.set(sessionId, status);
  }
  return next;
}
