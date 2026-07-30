import type { DiffStatus } from "@/utils/diffStatus";
import { pluralize } from "@/utils/string";

import { countChanged, type IoDiff, type TaskDiff } from "./comparePipelines";

function counted(count: number, noun: string): string {
  return `${count} ${pluralize(count, noun)}`;
}

/**
 * Short human summary of how a changed task differs between the two runs, used
 * as a subdued caption on graph nodes. Returns an empty string when there is
 * nothing structural to report (e.g. an outcome-only difference), letting the
 * caller decide whether to render anything.
 */
export function summarizeTaskChange(diff: TaskDiff): string {
  const parts: string[] = [];

  if (diff.componentChanged) parts.push("component");

  const changedArguments = countChanged(diff.argumentDiffs);
  if (changedArguments > 0) parts.push(counted(changedArguments, "argument"));

  const changedAnnotations = countChanged(diff.annotationDiffs);
  if (changedAnnotations > 0) {
    parts.push(counted(changedAnnotations, "annotation"));
  }

  if (diff.cacheChanged) {
    parts.push(diff.cacheDisabledB ? "cache disabled" : "cache enabled");
  }

  const changedSettings = diff.settingDiffs.filter(
    (entry) =>
      entry.status !== "unchanged" &&
      !(diff.cacheChanged && entry.key === "cachingStrategy"),
  ).length;
  if (changedSettings > 0) parts.push(counted(changedSettings, "setting"));

  return parts.join(" · ");
}

const ARTIFACT_CHANGE_LABEL: Partial<Record<DiffStatus, string>> = {
  changed: "artifact differs",
  lost: "artifact only in A",
  new: "artifact only in B",
};

/**
 * Short human summary of how a changed pipeline input/output differs. A rewired
 * producing task is called out explicitly, alongside the count of any other
 * fields that also changed, and a difference in the artifact the run actually
 * produced — which is invisible in the spec — is named on its own.
 */
export function summarizeIoChange(diff: IoDiff): string {
  const changedFields = diff.fieldDiffs.filter(
    (entry) => entry.status !== "unchanged",
  );
  const rewired = changedFields.some((entry) => entry.key === "source");
  const otherFields = rewired ? changedFields.length - 1 : changedFields.length;

  const parts: string[] = [];
  if (rewired) parts.push("source rewired");
  if (otherFields > 0) parts.push(`${counted(otherFields, "field")} changed`);

  const artifactLabel = diff.artifactStatus
    ? ARTIFACT_CHANGE_LABEL[diff.artifactStatus]
    : undefined;
  if (artifactLabel) parts.push(artifactLabel);

  return parts.join(" · ");
}
