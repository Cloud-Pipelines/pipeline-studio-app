import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Session } from "@/shell/contracts";
import { deleteSession } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

/** Deletes a session, then drops it from the cached list. */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Session[]>(SessionQueryKeys.All(), (prev) =>
        prev?.filter((session) => session.id !== id),
      );
      queryClient.removeQueries({ queryKey: SessionQueryKeys.Id(id) });
      void queryClient.invalidateQueries({ queryKey: SessionQueryKeys.All() });
    },
  });
}
