import { type ReactNode, useState } from "react";

import { InfoBox } from "@/components/shared/InfoBox";
import { Label } from "@/components/ui/label";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Switch } from "@/components/ui/switch";
import { Heading, Text } from "@/components/ui/typography";
import type { CompareMode } from "@/routes/v2/pages/CompareView/utils/compareMode";
import type { PipelineComparison } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import { ioDisplayStatus } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import { pluralize } from "@/utils/string";
import { tracking } from "@/utils/tracking";

import { IoDiffRow } from "./IoDiffRow";
import { TaskDiffRow } from "./TaskDiffRow";

interface SummaryCountProps {
  label: string;
  value: number;
}

function SummaryCount({ label, value }: SummaryCountProps) {
  return (
    <InlineStack gap="1" blockAlign="baseline">
      <Text as="span" size="sm" weight="semibold">
        {value}
      </Text>
      <Text as="span" size="sm" tone="subdued">
        {label}
      </Text>
    </InlineStack>
  );
}

function ChangeCount({ label, value }: SummaryCountProps) {
  return (
    <InlineStack gap="1" blockAlign="center">
      <span className="h-2 w-2 rounded-full bg-diff-changed" />
      <Text as="span" size="sm" weight="semibold">
        {value}
      </Text>
      <Text as="span" size="sm" tone="subdued">
        {label}
      </Text>
    </InlineStack>
  );
}

interface StructuredDiffViewProps {
  comparison: PipelineComparison;
  labelA: string;
  labelB: string;
  nameA: string;
  nameB: string;
  mode: CompareMode;
}

export function StructuredDiffView({
  comparison,
  labelA,
  labelB,
  nameA,
  nameB,
  mode,
}: StructuredDiffViewProps) {
  const [showUnchanged, setShowUnchanged] = useState(false);

  if (!comparison.hasComparableGraph) {
    return (
      <InfoBox title="Nothing to compare" variant="info" width="full">
        {mode.kind === "empty"
          ? "Select two runs to compare their inputs, tasks, and outputs."
          : "Neither run has a graph pipeline, so there are no tasks, inputs, or outputs to align. Use the YAML tab to compare the raw specifications."}
      </InfoBox>
    );
  }

  const { counts } = comparison;

  /**
   * A single run is compared against itself, so every count is zero and every
   * row is "unchanged" — revealing them would list the same run twice, with both
   * pills naming it. There is no diff to control until a second run is picked.
   */
  const isSingleRun = mode.kind === "single";
  const showUnchangedRows = showUnchanged && !isSingleRun;

  const visibleInputs = showUnchangedRows
    ? comparison.inputDiffs
    : comparison.inputDiffs.filter((diff) => diff.status !== "unchanged");
  const visibleOutputs = showUnchangedRows
    ? comparison.outputDiffs
    : comparison.outputDiffs.filter(
        (diff) => ioDisplayStatus(diff) !== "unchanged",
      );
  const visibleTasks = showUnchangedRows
    ? comparison.taskDiffs
    : comparison.taskDiffs.filter(
        (diff) => diff.status !== "unchanged" || diff.outcomeChanged,
      );

  const nothingVisible =
    visibleInputs.length === 0 &&
    visibleOutputs.length === 0 &&
    visibleTasks.length === 0;

  return (
    <BlockStack gap="4" className="w-full">
      {!isSingleRun && (
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="4"
          className="w-full"
        >
          <InlineStack gap="4" blockAlign="center" wrap="wrap">
            <SummaryCount label="added" value={counts.added} />
            <SummaryCount label="removed" value={counts.removed} />
            <SummaryCount label="changed" value={counts.changed} />
            <SummaryCount label="unchanged" value={counts.unchanged} />
            {counts.outcomeChanged > 0 && (
              <ChangeCount
                value={counts.outcomeChanged}
                label="outcome differs"
              />
            )}
            {counts.outputArtifactChanged > 0 && (
              <ChangeCount
                value={counts.outputArtifactChanged}
                label={`output ${pluralize(counts.outputArtifactChanged, "artifact")} ${counts.outputArtifactChanged === 1 ? "differs" : "differ"}`}
              />
            )}
          </InlineStack>
          <InlineStack gap="2" blockAlign="center" wrap="nowrap">
            <Switch
              id="compare-show-unchanged"
              checked={showUnchanged}
              onCheckedChange={setShowUnchanged}
              {...tracking("compare_runs.structured_diff.show_unchanged", {
                new_value: !showUnchanged,
              })}
            />
            <Label htmlFor="compare-show-unchanged">Show unchanged</Label>
          </InlineStack>
        </InlineStack>
      )}

      {nothingVisible ? (
        isSingleRun ? (
          <InfoBox title="One run selected" variant="info" width="full">
            Select a second run to make a structured comparison.
          </InfoBox>
        ) : (
          <InfoBox title="No differences" variant="success" width="full">
            These two runs match on inputs, tasks, outcomes, and pipeline output
            artifacts. Artifacts produced inside a task are compared when you
            open that task — switch on Show unchanged to list them.
          </InfoBox>
        )
      ) : (
        <BlockStack gap="5" className="w-full">
          {visibleInputs.length > 0 && (
            <DiffSection title="Inputs">
              {visibleInputs.map((diff) => (
                <IoDiffRow
                  key={diff.name}
                  diff={diff}
                  labelA={labelA}
                  labelB={labelB}
                />
              ))}
            </DiffSection>
          )}
          {visibleTasks.length > 0 && (
            <DiffSection title="Tasks">
              {visibleTasks.map((diff) => (
                <TaskDiffRow
                  key={diff.taskId}
                  diff={diff}
                  labelA={labelA}
                  labelB={labelB}
                  nameA={nameA}
                  nameB={nameB}
                />
              ))}
            </DiffSection>
          )}
          {visibleOutputs.length > 0 && (
            <DiffSection title="Outputs">
              {visibleOutputs.map((diff) => (
                <IoDiffRow
                  key={diff.name}
                  diff={diff}
                  labelA={labelA}
                  labelB={labelB}
                />
              ))}
            </DiffSection>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}

interface DiffSectionProps {
  title: string;
  children: ReactNode;
}

function DiffSection({ title, children }: DiffSectionProps) {
  return (
    <BlockStack gap="2" className="w-full">
      <Heading level={3}>{title}</Heading>
      <BlockStack gap="2" className="w-full">
        {children}
      </BlockStack>
    </BlockStack>
  );
}
