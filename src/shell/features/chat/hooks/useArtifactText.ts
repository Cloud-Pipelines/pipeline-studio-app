import { useQuery } from "@tanstack/react-query";

import { getArtifactText } from "@/shell/features/sessions/api/sessionsApi";

/**
 * Fetches the raw text of an artifact by its resolved file API URL. Disabled
 * until a URL is provided and when `enabled` is false (e.g. for non-text
 * artifacts that render in an iframe instead).
 */
export function useArtifactText(url: string, enabled = true) {
  return useQuery({
    queryKey: ["artifact-text", url],
    queryFn: () => getArtifactText(url),
    enabled: enabled && url.length > 0,
  });
}
