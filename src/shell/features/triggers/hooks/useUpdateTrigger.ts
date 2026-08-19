import { useMutation } from "@tanstack/react-query";

import type { UpdateTriggerRequest } from "@/shell/contracts";

import { updateTrigger } from "../api/triggersApi";

/**
 * Updates a trigger (enable/disable, prompt, title, schedule). The session room
 * broadcasts the refreshed trigger roster over the socket, so the panel updates
 * without a query invalidation.
 */
export function useUpdateTrigger(sessionId: string) {
  return useMutation({
    mutationFn: (vars: { triggerId: string; input: UpdateTriggerRequest }) =>
      updateTrigger(sessionId, vars.triggerId, vars.input),
  });
}
