import { useMutation } from "@tanstack/react-query";

import { deleteTrigger } from "../api/triggersApi";

/**
 * Deletes a trigger. The session room broadcasts the refreshed roster over the
 * socket, so the panel updates without a query invalidation.
 */
export function useDeleteTrigger(sessionId: string) {
  return useMutation({
    mutationFn: (triggerId: string) => deleteTrigger(sessionId, triggerId),
  });
}
