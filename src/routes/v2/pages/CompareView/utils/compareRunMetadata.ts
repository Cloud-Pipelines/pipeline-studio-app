import {
  PIPELINE_RUN_NOTES_ANNOTATION,
  PIPELINE_TAGS_ANNOTATION,
} from "@/utils/annotationKeys";

import {
  countChanged,
  diffKeyedRecords,
  type KeyedDiffEntry,
  stripFrontendAnnotations,
} from "./comparePipelines";

/**
 * Free-text annotations a person edits on the run itself. They say nothing about
 * what the run did, so a difference in them is not a difference worth reporting.
 */
const SUPERFICIAL_ANNOTATION_KEYS = new Set<string>([
  PIPELINE_RUN_NOTES_ANNOTATION,
  PIPELINE_TAGS_ANNOTATION,
]);

export interface RunMetadataInput {
  createdBy?: string;
  createdAt?: string;
  status?: string;
  durationMs?: number;
  annotations?: Record<string, unknown>;
  arguments?: Record<string, unknown>;
}

interface ScalarDiff {
  a?: string;
  b?: string;
  changed: boolean;
}

interface DurationDiff {
  a?: number;
  b?: number;
  changed: boolean;
}

export interface RunMetadataComparison {
  author: ScalarDiff;
  createdAt: ScalarDiff;
  status: ScalarDiff;
  duration: DurationDiff;
  annotationDiffs: KeyedDiffEntry<unknown>[];
  argumentDiffs: KeyedDiffEntry<unknown>[];
  changeCount: number;
  hasChanges: boolean;
}

/**
 * Two runs of the same pipeline never take exactly the same time, so a duration
 * counts as a difference only when the gap is both absolutely and
 * proportionally large. Without the second test every long run would report a
 * difference; without the first, every short one would.
 */
const DURATION_NOISE_MS = 5_000;
const DURATION_NOISE_RATIO = 0.1;

function stripComparableAnnotations(
  annotations: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    stripFrontendAnnotations(annotations),
  )) {
    if (!SUPERFICIAL_ANNOTATION_KEYS.has(key)) result[key] = value;
  }
  return result;
}

function scalarDiff(a: string | undefined, b: string | undefined): ScalarDiff {
  return { a, b, changed: (a ?? "") !== (b ?? "") };
}

/**
 * A side whose value has not arrived yet is not a difference — comparing a
 * loaded run against a loading one would report a change that disappears a
 * moment later.
 */
function knownScalarDiff(
  a: string | undefined,
  b: string | undefined,
): ScalarDiff {
  return a && b ? scalarDiff(a, b) : { a, b, changed: false };
}

function durationDiff(
  a: number | undefined,
  b: number | undefined,
): DurationDiff {
  if (a === undefined || b === undefined) return { a, b, changed: false };

  const gap = Math.abs(a - b);
  const changed =
    gap >= DURATION_NOISE_MS && gap / Math.max(a, b) >= DURATION_NOISE_RATIO;

  return { a, b, changed };
}

/**
 * Compares run-level context between two runs. Annotation and argument keys are
 * treated generically — the platform is agnostic about which keys exist, so
 * whatever a deployment stores surfaces here. Superficial keys (notes, tags)
 * and frontend-only annotations are excluded. `createdAt` is surfaced for
 * context but does not count toward `hasChanges`, since two distinct runs
 * always have different timestamps; how long they took and how they ended do
 * count, because those describe what happened rather than when it started.
 */
export function buildRunMetadataComparison(
  a: RunMetadataInput,
  b: RunMetadataInput,
): RunMetadataComparison {
  const author = scalarDiff(a.createdBy, b.createdBy);
  const createdAt = scalarDiff(a.createdAt, b.createdAt);
  const status = knownScalarDiff(a.status, b.status);
  const duration = durationDiff(a.durationMs, b.durationMs);
  const annotationDiffs = diffKeyedRecords(
    stripComparableAnnotations(a.annotations),
    stripComparableAnnotations(b.annotations),
  );
  const argumentDiffs = diffKeyedRecords(a.arguments, b.arguments);

  const changeCount =
    (author.changed ? 1 : 0) +
    (status.changed ? 1 : 0) +
    (duration.changed ? 1 : 0) +
    countChanged(annotationDiffs) +
    countChanged(argumentDiffs);

  return {
    author,
    createdAt,
    status,
    duration,
    annotationDiffs,
    argumentDiffs,
    changeCount,
    hasChanges: changeCount > 0,
  };
}
