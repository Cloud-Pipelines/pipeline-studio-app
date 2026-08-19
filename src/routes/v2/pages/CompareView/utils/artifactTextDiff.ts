const DIFF_LANGUAGES: Record<string, string> = {
  text: "plaintext",
  csv: "plaintext",
  tsv: "plaintext",
  jsonobject: "json",
  jsonarray: "json",
};

/**
 * Monaco language for diffing a pair of artifacts, or `undefined` when the pair
 * cannot be diffed as text — images and parquet have no line-oriented form, so
 * those keep their side-by-side previews. Takes resolved artifact types.
 */
export function artifactDiffLanguage(
  typeA: string,
  typeB: string,
): string | undefined {
  const languageA = DIFF_LANGUAGES[typeA];
  const languageB = DIFF_LANGUAGES[typeB];
  if (!languageA || !languageB) return undefined;
  return languageA === languageB ? languageA : "plaintext";
}

/**
 * Minified JSON lands on a single line, where a line diff reports the whole
 * artifact as changed. Re-print it so the diff lands on the fields that
 * actually differ, leaving anything unparseable as it came.
 */
export function normalizeForDiff(text: string, language: string): string {
  if (language !== "json") return text;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
