import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UpdateSessionRequest } from "@/shell/contracts";
import { updateSession } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

interface UpdateSessionVariables {
  id: string;
  input: UpdateSessionRequest;
}

/** Renames or archives a session, then refreshes the relevant query caches. */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateSessionVariables) =>
      updateSession(id, input),
    onSuccess: (session) => {
      queryClient.setQueryData(SessionQueryKeys.Id(session.id), session);
      void queryClient.invalidateQueries({ queryKey: SessionQueryKeys.All() });
    },
  });
}
