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

export function useContainerLog(
  executionId: string | number | undefined,
  status: string | undefined,
  { enabled = true }: UseContainerLogOptions = {},
) {
  const { backendUrl } = useBackend();

  const shouldFetch = enabled && !!executionId && shouldStatusHaveLogs(status);

  return useQuery({
    queryKey: ["logs", backendUrl, executionId],
    queryFn: () => fetchContainerLog(String(executionId), backendUrl),
    enabled: shouldFetch,
    refetchInterval:
      shouldFetch && isStatusActivelyLogging(status)
        ? LOG_POLL_INTERVAL_MS
        : false,
    refetchIntervalInBackground: false,
  });
}
