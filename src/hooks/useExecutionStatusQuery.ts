import { useQuery } from "@tanstack/react-query";

import { fetchExecutionStatus } from "@/services/executionService";

export function useExecutionStatusQuery(executionId: string) {
  return useQuery({
    queryKey: ["executionStatus", executionId],
    queryFn: () => fetchExecutionStatus(executionId),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!executionId,
  });
}
