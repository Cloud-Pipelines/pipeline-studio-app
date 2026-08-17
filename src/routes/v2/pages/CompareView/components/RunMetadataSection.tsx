import type { ReactNode } from "react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { CompareMode } from "@/routes/v2/pages/CompareView/utils/compareMode";
import type { KeyedDiffEntry } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import {
  buildRunMetadataComparison,
  type RunMetadataInput,
} from "@/routes/v2/pages/CompareView/utils/compareRunMetadata";
import { formatDate, formatDurationMs } from "@/utils/date";
import { getExecutionStatusLabel } from "@/utils/executionStatus";
import { tracking } from "@/utils/tracking";

import { DiffStatusBadge } from "./DiffStatusBadge";
import { ExecutionStatusPill } from "./ExecutionStatusPill";
import { FieldDiffRow } from "./FieldDiffRow";
import { RunTag } from "./RunTag";

interface RunMetadataSectionProps {
  a: RunMetadataInput;
  b: RunMetadataInput;
  labelA: string;
  labelB: string;
  mode: CompareMode;
}

function MetadataBar({ children }: { children: ReactNode }) {
  return (
    <InlineStack
      gap="3"
      blockAlign="center"
      wrap="wrap"
      className="w-full rounded-lg border px-3 py-2"
    >
      <Text as="span" size="sm" weight="semibold">
        Run metadata
      </Text>
      {children}
    </InlineStack>
  );
}

function scalarEntry(
  key: string,
  a: string | undefined,
  b: string | undefined,
  changed: boolean,
): KeyedDiffEntry<unknown> {
  return { key, a, b, status: changed ? "changed" : "unchanged" };
}

const statusText = (status: string | undefined) =>
  status ? getExecutionStatusLabel(status) : undefined;

const durationText = (durationMs: number | undefined) =>
  durationMs === undefined ? undefined : formatDurationMs(durationMs);

interface RunSummaryProps {
  run: "a" | "b";
  label: string;
  author: string | undefined;
  createdAt: string | undefined;
  status: string | undefined;
  durationMs: number | undefined;
}

function RunSummary({
  run,
  label,
  author,
  createdAt,
  status,
  durationMs,
}: RunSummaryProps) {
  return (
    <InlineStack gap="2" blockAlign="center" wrap="nowrap" className="min-w-0">
      <RunTag run={run} label={label} />
      <Text as="span" size="xs" weight="semibold" className="truncate">
        {author ?? "Unknown author"}
      </Text>
      <Text as="span" size="xs" tone="subdued" className="whitespace-nowrap">
        {createdAt ? formatDate(createdAt) : "Unknown"}
      </Text>
      <ExecutionStatusPill status={status} />
      {durationMs !== undefined && (
        <Text as="span" size="xs" tone="subdued" className="whitespace-nowrap">
          {formatDurationMs(durationMs)}
        </Text>
      )}
    </InlineStack>
  );
}

export function RunMetadataSection({
  a,
  b,
  labelA,
  labelB,
  mode,
}: RunMetadataSectionProps) {
  if (mode.kind === "empty") {
    return (
      <MetadataBar>
        <Text as="span" size="sm" tone="subdued">
          Select runs to compare.
        </Text>
      </MetadataBar>
    );
  }

  if (mode.kind === "single") {
    const present = mode.side === "a" ? a : b;
    return (
      <MetadataBar>
        <RunSummary
          run={mode.side}
          label={mode.side === "a" ? labelA : labelB}
          author={present.createdBy}
          createdAt={present.createdAt}
          status={present.status}
          durationMs={present.durationMs}
        />
      </MetadataBar>
    );
  }

  return <RunMetadataComparison a={a} b={b} labelA={labelA} labelB={labelB} />;
}

function RunMetadataComparison({
  a,
  b,
  labelA,
  labelB,
}: Omit<RunMetadataSectionProps, "mode">) {
  const [open, setOpen] = useState(false);
  const comparison = buildRunMetadataComparison(a, b);

  const changedAnnotations = comparison.annotationDiffs.filter(
    (entry) => entry.status !== "unchanged",
  );
  const changedArguments = comparison.argumentDiffs.filter(
    (entry) => entry.status !== "unchanged",
  );

  const summary = (
    <InlineStack gap="4" wrap="wrap" blockAlign="center">
      <RunSummary
        run="a"
        label={labelA}
        author={comparison.author.a}
        createdAt={comparison.createdAt.a}
        status={comparison.status.a}
        durationMs={comparison.duration.a}
      />
      <RunSummary
        run="b"
        label={labelB}
        author={comparison.author.b}
        createdAt={comparison.createdAt.b}
        status={comparison.status.b}
        durationMs={comparison.duration.b}
      />
    </InlineStack>
  );

  if (!comparison.hasChanges) {
    return <MetadataBar>{summary}</MetadataBar>;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger
        className="flex w-full flex-wrap items-center gap-3 px-3 py-2"
        {...tracking("compare_runs.run_metadata.toggle")}
      >
        <InlineStack gap="2" blockAlign="center" wrap="nowrap">
          <Icon
            name="ChevronRight"
            size="sm"
            className={cn("transition-transform", open && "rotate-90")}
          />
          <Text as="span" size="sm" weight="semibold">
            Run metadata
          </Text>
          <InlineStack
            as="span"
            className="rounded-full bg-diff-changed/20 px-2 py-0.5 text-diff-changed"
          >
            <Text
              as="span"
              size="xs"
              weight="semibold"
              className="text-inherit"
            >
              {comparison.changeCount} changed
            </Text>
          </InlineStack>
        </InlineStack>
        {summary}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <BlockStack gap="2" className="px-3 pb-3">
          <FieldDiffRow
            entry={scalarEntry(
              "author",
              comparison.author.a,
              comparison.author.b,
              comparison.author.changed,
            )}
            labelA={labelA}
            labelB={labelB}
          />
          <FieldDiffRow
            entry={scalarEntry(
              "created",
              comparison.createdAt.a,
              comparison.createdAt.b,
              comparison.createdAt.changed,
            )}
            labelA={labelA}
            labelB={labelB}
          />
          <FieldDiffRow
            entry={scalarEntry(
              "status",
              statusText(comparison.status.a),
              statusText(comparison.status.b),
              comparison.status.changed,
            )}
            labelA={labelA}
            labelB={labelB}
          />
          <FieldDiffRow
            entry={scalarEntry(
              "duration",
              durationText(comparison.duration.a),
              durationText(comparison.duration.b),
              comparison.duration.changed,
            )}
            labelA={labelA}
            labelB={labelB}
          />

          {changedAnnotations.length > 0 && (
            <BlockStack gap="1">
              <InlineStack gap="2" blockAlign="center">
                <Text as="span" size="xs" weight="semibold" tone="subdued">
                  Run annotations
                </Text>
                <DiffStatusBadge status="changed" />
              </InlineStack>
              {changedAnnotations.map((entry) => (
                <FieldDiffRow
                  key={entry.key}
                  entry={entry}
                  labelA={labelA}
                  labelB={labelB}
                />
              ))}
            </BlockStack>
          )}

          {changedArguments.length > 0 && (
            <BlockStack gap="1">
              <InlineStack gap="2" blockAlign="center">
                <Text as="span" size="xs" weight="semibold" tone="subdued">
                  Run arguments
                </Text>
                <DiffStatusBadge status="changed" />
              </InlineStack>
              {changedArguments.map((entry) => (
                <FieldDiffRow
                  key={entry.key}
                  entry={entry}
                  labelA={labelA}
                  labelB={labelB}
                />
              ))}
            </BlockStack>
          )}
        </BlockStack>
      </CollapsibleContent>
    </Collapsible>
  );
}
