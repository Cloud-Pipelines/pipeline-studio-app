import { useState } from "react";

import type {
  ArtifactNodeResponse,
  GetExecutionArtifactsResponse,
} from "@/api/types.gen";
import {
  isVisualizableType,
  normalizeRawType,
  resolveArtifactType,
} from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/artifactType";
import { MAX_VISUALIZABLE_SIZE_BYTES } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/ArtifactVisualizer/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import { useExecutionArtifacts } from "@/hooks/useExecutionArtifacts";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";
import type { DiffStatus } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import { unionKeysAFirst } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
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

function artifactStatus(
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

function ArtifactDiffRow({ name, a, b, labelA, labelB }: ArtifactDiffRowProps) {
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
          <DiffStatusBadge status={artifactStatus(a, b)} />
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

function outputArtifacts(
  data: GetExecutionArtifactsResponse | null | undefined,
): Record<string, ArtifactNodeResponse> {
  return data?.output_artifacts ?? {};
}

interface ArtifactDiffSectionProps {
  executionIdA?: string;
  executionIdB?: string;
  labelA: string;
  labelB: string;
}

function ArtifactDiffList({
  executionIdA,
  executionIdB,
  labelA,
  labelB,
}: ArtifactDiffSectionProps) {
  const queryA = useExecutionArtifacts(executionIdA);
  const queryB = useExecutionArtifacts(executionIdB);

  const isLoading =
    (queryA.isFetching && !queryA.data) || (queryB.isFetching && !queryB.data);

  if (isLoading) {
    return (
      <InlineStack gap="2" blockAlign="center">
        <Spinner />
        <Text as="span" size="xs" tone="subdued">
          Loading artifacts…
        </Text>
      </InlineStack>
    );
  }

  const artifactsA = outputArtifacts(queryA.data);
  const artifactsB = outputArtifacts(queryB.data);
  const names = unionKeysAFirst(artifactsA, artifactsB);

  if (names.length === 0) {
    return (
      <Text as="span" size="xs" tone="subdued">
        No output artifacts.
      </Text>
    );
  }

  return (
    <BlockStack gap="2">
      {names.map((name) => (
        <ArtifactDiffRow
          key={name}
          name={name}
          a={artifactsA[name]}
          b={artifactsB[name]}
          labelA={labelA}
          labelB={labelB}
        />
      ))}
    </BlockStack>
  );
}

/**
 * A section is rendered per compared task, so keeping the two artifact queries
 * in a child that Radix only mounts once expanded is what stops a wide pipeline
 * from firing two requests per task the moment the tab opens.
 */
export function ArtifactDiffSection({
  executionIdA,
  executionIdB,
  labelA,
  labelB,
}: ArtifactDiffSectionProps) {
  const { configured } = useBackend();
  const [open, setOpen] = useState(false);

  if (!configured || (!executionIdA && !executionIdB)) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="-ml-1 gap-1 px-1"
          {...tracking("compare_runs.task.toggle_artifacts")}
        >
          <Icon
            name="ChevronRight"
            size="xs"
            className={cn("transition-transform", open && "rotate-90")}
          />
          <Text as="span" size="xs" weight="semibold" tone="subdued">
            Artifacts
          </Text>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <ArtifactDiffList
          executionIdA={executionIdA}
          executionIdB={executionIdB}
          labelA={labelA}
          labelB={labelB}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
