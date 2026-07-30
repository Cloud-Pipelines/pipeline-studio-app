const UNSET_LABEL = "(unset)";

/**
 * Renders one side of a diffed field as display text. Absent values read as
 * `(unset)` rather than an empty gap, so a removed value stays visible.
 */
export function formatDiffValue(value: unknown): string {
  if (value === undefined) return UNSET_LABEL;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
