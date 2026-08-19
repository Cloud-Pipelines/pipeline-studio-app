import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

export function useSession(id: string) {
  return useQuery({
    queryKey: SessionQueryKeys.Id(id),
    queryFn: () => getSession(id),
    enabled: id.length > 0,
  });
}
