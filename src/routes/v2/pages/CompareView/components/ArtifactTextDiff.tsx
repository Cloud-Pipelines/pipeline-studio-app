import { InfoBox } from "@/components/shared/InfoBox";
import { PreviewSkeleton } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/ArtifactPreviewContent";
import { useArtifactText } from "@/routes/v2/pages/CompareView/hooks/useArtifactText";
import { normalizeForDiff } from "@/routes/v2/pages/CompareView/utils/artifactTextDiff";

import { DiffCodeViewer } from "./DiffCodeViewer";

interface ArtifactTextDiffProps {
  artifactIdA: string;
  artifactIdB: string;
  labelA: string;
  labelB: string;
  language: string;
}

export function ArtifactTextDiff({
  artifactIdA,
  artifactIdB,
  labelA,
  labelB,
  language,
}: ArtifactTextDiffProps) {
  const a = useArtifactText(artifactIdA);
  const b = useArtifactText(artifactIdB);

  const failedRuns: string[] = [];
  if (a.isError) failedRuns.push(labelA);
  if (b.isError) failedRuns.push(labelB);

  if (failedRuns.length > 0) {
    return (
      <InfoBox title="Artifact unavailable" variant="error" width="full">
        Could not load the artifact for {failedRuns.join(" and ")}. Open it from
        the run&apos;s own output to retry.
      </InfoBox>
    );
  }

  if (a.text === undefined || b.text === undefined) {
    return <PreviewSkeleton />;
  }

  return (
    <DiffCodeViewer
      original={normalizeForDiff(a.text, language)}
      modified={normalizeForDiff(b.text, language)}
      language={language}
    />
  );
}
