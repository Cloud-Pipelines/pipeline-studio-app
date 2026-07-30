import { useQuery } from "@tanstack/react-query";

import { useBackend } from "@/providers/BackendProvider";
import { fetchContainerLog } from "@/services/executionService";
import {
  isStatusActivelyLogging,
  shouldStatusHaveLogs,
} from "@/utils/executionStatus";

const LOG_POLL_INTERVAL_MS = 5000;

interface UseContainerLogOptions {
  enabled?: boolean;
}

/**
 * Sole owner of the `["logs", executionId]` cache entry. Several views read the
 * same container's log at once, and react-query gives an entry the options of
 * whichever query mounted last — so the polling decision has to live here, or a
 * running task stops refreshing depending on which view the user opened first.
 */
export function useContainerLog(
  executionId: string | number | undefined,
  status: string | undefined,
  { enabled = true }: UseContainerLogOptions = {},
) {
  const { backendUrl } = useBackend();

  const shouldFetch = enabled && !!executionId && shouldStatusHaveLogs(status);

  return useQuery({
    queryKey: ["logs", executionId],
    queryFn: () => fetchContainerLog(String(executionId), backendUrl),
    enabled: shouldFetch,
    refetchInterval:
      shouldFetch && isStatusActivelyLogging(status)
        ? LOG_POLL_INTERVAL_MS
        : false,
    refetchIntervalInBackground: false,
  });
}
