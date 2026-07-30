import { useQuery } from "@tanstack/react-query";

import { useBackend } from "@/providers/BackendProvider";
import { getExecutionArtifacts } from "@/services/executionService";

export function useExecutionArtifacts(
  executionId: string | number | undefined,
) {
  const { backendUrl } = useBackend();

  return useQuery({
    queryKey: ["artifacts", backendUrl, executionId],
    queryFn: () => getExecutionArtifacts(String(executionId), backendUrl),
    enabled: !!executionId,
  });
}
