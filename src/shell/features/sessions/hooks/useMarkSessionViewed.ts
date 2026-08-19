import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markSessionViewed } from "@/shell/features/sessions/api/sessionsApi";
import { SessionQueryKeys } from "@/shell/features/sessions/model/sessionQueryKeys";

/** Marks a session viewed, then refreshes the list so its unread badge clears. */
export function useMarkSessionViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markSessionViewed,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SessionQueryKeys.All() });
    },
  });
}
