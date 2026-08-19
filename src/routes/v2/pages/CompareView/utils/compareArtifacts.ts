import type {
  ArtifactNodeResponse,
  GetExecutionArtifactsResponse,
} from "@/api/types.gen";
import type { DiffStatus } from "@/utils/diffStatus";

export function outputArtifactsOf(
  data: GetExecutionArtifactsResponse | null | undefined,
): Record<string, ArtifactNodeResponse> {
  return data?.output_artifacts ?? {};
}

/**
 * Compares two artifacts by what the backend reports about their contents, not
 * by id: ids are minted per execution, so two runs that produced byte-identical
 * output would always look different. Inline value, size and directory-ness are
 * all the artifact listing carries about the content itself — a same-size file
 * with different bytes reads as unchanged, which is the limit of this data.
 */
export function artifactDiffStatus(
  a: ArtifactNodeResponse | undefined,
  b: ArtifactNodeResponse | undefined,
): DiffStatus {
  if (a && !b) return "lost";
  if (!a && b) return "new";
  if (!a || !b) return "unchanged";

  const same =
    (a.artifact_data?.value ?? null) === (b.artifact_data?.value ?? null) &&
    (a.artifact_data?.total_size ?? null) ===
      (b.artifact_data?.total_size ?? null) &&
    (a.artifact_data?.is_dir ?? null) === (b.artifact_data?.is_dir ?? null);

  return same ? "unchanged" : "changed";
}
