import { useState } from "react";

import type { ArtifactNodeResponse } from "@/api/types.gen";
import {
  isVisualizableType,
  normalizeRawType,
  resolveArtifactType,
} from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/artifactType";
import { MAX_VISUALIZABLE_SIZE_BYTES } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { artifactDiffStatus } from "@/routes/v2/pages/CompareView/utils/compareArtifacts";
import { formatBytes } from "@/utils/string";
import { tracking } from "@/utils/tracking";

import { ArtifactComparisonDialog } from "./ArtifactComparisonDialog";
import { DiffStatusBadge } from "./DiffStatusBadge";
import { RunTag } from "./RunTag";

function inlineValue(
  artifact: ArtifactNodeResponse | undefined,
): string | undefined {
  const value = artifact?.artifact_data?.value;
  return value && value.trim() !== "" ? value : undefined;
}

function artifactTypeLabel(
  artifact: ArtifactNodeResponse | undefined,
): string | undefined {
  if (!artifact) return undefined;
  return (
    artifact.type_name ?? (artifact.artifact_data?.is_dir ? "Directory" : "Any")
  );
}

function isPreviewable(artifact: ArtifactNodeResponse | undefined): boolean {
  if (!artifact) return false;
  const totalSize = artifact.artifact_data?.total_size;
  if (totalSize && totalSize > MAX_VISUALIZABLE_SIZE_BYTES) return false;
  const type = resolveArtifactType(
    normalizeRawType(artifactTypeLabel(artifact) ?? undefined),
  );
  return isVisualizableType(type);
}

interface InlineValueLineProps {
  run: "a" | "b";
  label: string;
  value: string | undefined;
  present: boolean;
}

function InlineValueLine({ run, label, value, present }: InlineValueLineProps) {
  return (
    <InlineStack gap="2" blockAlign="start" wrap="nowrap" className="min-w-0">
      <RunTag run={run} label={label} />
      <Text
        as="span"
        size="xs"
        font="mono"
        tone={present ? "inherit" : "subdued"}
        className="break-all whitespace-pre-wrap"
      >
        {present ? (value ?? "(none)") : "absent"}
      </Text>
    </InlineStack>
  );
}

interface MetadataLineProps {
  run: "a" | "b";
  label: string;
  artifact: ArtifactNodeResponse | undefined;
}

function MetadataLine({ run, label, artifact }: MetadataLineProps) {
  const totalSize = artifact?.artifact_data?.total_size;
  return (
    <InlineStack gap="2" blockAlign="center" wrap="nowrap" className="min-w-0">
      <RunTag run={run} label={label} />
      {!artifact ? (
        <Text as="span" size="xs" tone="subdued">
          absent
        </Text>
      ) : (
        <>
          <Text as="span" size="xs" tone="subdued" className="truncate">
            {artifactTypeLabel(artifact)}
          </Text>
          {!!totalSize && (
            <Text as="span" size="xs" tone="subdued" font="mono">
              ({formatBytes(totalSize)})
            </Text>
          )}
        </>
      )}
    </InlineStack>
  );
}

interface ArtifactDiffRowProps {
  name: string;
  a: ArtifactNodeResponse | undefined;
  b: ArtifactNodeResponse | undefined;
  labelA: string;
  labelB: string;
}

export function ArtifactDiffRow({
  name,
  a,
  b,
  labelA,
  labelB,
}: ArtifactDiffRowProps) {
  const [compareOpen, setCompareOpen] = useState(false);

  const aVal = inlineValue(a);
  const bVal = inlineValue(b);
  const hasInline = aVal !== undefined || bVal !== undefined;
  const canCompare = isPreviewable(a) || isPreviewable(b);

  return (
    <BlockStack gap="1" className="rounded-md border p-2">
      <InlineStack
        gap="2"
        blockAlign="center"
        align="space-between"
        wrap="wrap"
        className="w-full"
      >
        <InlineStack gap="2" blockAlign="center" wrap="wrap">
          <Text as="span" size="xs" weight="semibold" className="font-mono">
            {name}
          </Text>
          <DiffStatusBadge status={artifactDiffStatus(a, b)} />
        </InlineStack>
        {!hasInline && canCompare && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCompareOpen(true)}
            {...tracking("compare_runs.task.compare_artifact")}
          >
            <Icon name="Columns2" size="xs" />
            Compare
          </Button>
        )}
      </InlineStack>

      {hasInline ? (
        <BlockStack gap="1">
          <InlineValueLine run="a" label={labelA} value={aVal} present={!!a} />
          <InlineValueLine run="b" label={labelB} value={bVal} present={!!b} />
        </BlockStack>
      ) : (
        <InlineStack gap="4" wrap="wrap">
          <MetadataLine run="a" label={labelA} artifact={a} />
          <MetadataLine run="b" label={labelB} artifact={b} />
        </InlineStack>
      )}

      {!hasInline && canCompare && (
        <ArtifactComparisonDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          name={name}
          labelA={labelA}
          labelB={labelB}
          artifactA={a}
          artifactB={b}
          typeA={artifactTypeLabel(a)}
          typeB={artifactTypeLabel(b)}
        />
      )}
    </BlockStack>
  );
}
