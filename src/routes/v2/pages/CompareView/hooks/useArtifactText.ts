import { skipToken, useQuery } from "@tanstack/react-query";

import { fetchArtifactOrThrow } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/useArtifactFetch";
import { useBackend } from "@/providers/BackendProvider";
import { getArtifactSignedUrl } from "@/services/executionService";
import { HOURS } from "@/utils/constants";

interface ArtifactText {
  text: string | undefined;
  isError: boolean;
}

export function useArtifactText(artifactId: string): ArtifactText {
  const { backendUrl } = useBackend();

  const signedUrlQuery = useQuery({
    queryKey: ["artifact-signed-url", backendUrl, artifactId],
    queryFn: () => getArtifactSignedUrl(artifactId, backendUrl),
    staleTime: 24 * HOURS,
    retry: false,
  });

  const signedUrl = signedUrlQuery.data?.signed_url;

  const textQuery = useQuery({
    queryKey: ["artifact-text", signedUrl],
    queryFn: signedUrl
      ? async () => (await fetchArtifactOrThrow(signedUrl)).text()
      : skipToken,
    staleTime: 24 * HOURS,
    retry: false,
  });

  return {
    text: textQuery.data,
    isError:
      signedUrlQuery.isError ||
      textQuery.isError ||
      (signedUrlQuery.isSuccess && !signedUrl),
  };
}
