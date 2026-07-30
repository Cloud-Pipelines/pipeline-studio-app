/**
 * Which runs the comparison page currently has. `single` carries the side that
 * is filled in, so views never have to guess it back out of the run data.
 */
export type CompareMode =
  { kind: "empty" } | { kind: "single"; side: "a" | "b" } | { kind: "both" };
