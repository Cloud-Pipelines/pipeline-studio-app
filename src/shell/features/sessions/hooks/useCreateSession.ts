import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSession } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SessionQueryKeys.All() });
    },
  });
}
