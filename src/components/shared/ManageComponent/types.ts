import type { ComponentReference } from "@/utils/componentSpec";

/**
 * Type guard to check if a component has a superseded_by field
 */
export function hasSupersededBy(
  c: ComponentReference,
): c is ComponentReference & { superseded_by: string } {
  return Boolean(c.superseded_by);
}
