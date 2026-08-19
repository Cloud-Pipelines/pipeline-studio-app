import { useQuery } from "@tanstack/react-query";

import { listSessions } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

export function useSessions() {
  return useQuery({
    queryKey: SessionQueryKeys.All(),
    queryFn: listSessions,
  });
}
