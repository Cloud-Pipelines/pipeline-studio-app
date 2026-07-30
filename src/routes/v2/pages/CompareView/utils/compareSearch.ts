export interface CompareSearch {
  a?: string;
  b?: string;
}

/**
 * Run ids arrive as search params, which the router JSON-parses: `?a=123`
 * reaches the page as a number, and anything else can be an array or object. A
 * run id is only ever a string here, so coerce what can be coerced and drop the
 * rest rather than handing a non-string id to the run queries.
 */
function toRunId(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

export function validateCompareSearch(search: unknown): CompareSearch {
  const record =
    typeof search === "object" && search !== null
      ? (search as Record<string, unknown>)
      : {};

  return { a: toRunId(record.a), b: toRunId(record.b) };
}
