# Pillar: dry — DRY / dedup

Finds duplicated logic across files and consolidates it, preferring to adopt an existing helper in
`src/utils`, `src/hooks`, or `src/lib` over extracting a new one.

## Pillar spec

- **PILLAR_ID:** `dry`
- **CATEGORY_IDS:** `dry` (threshold + flags from that block in `.github/gardening-config.json`)
- **CONVENTION_SKILLS:** `project-conventions` (file structure, `@/` imports, no barrel exports) and
  `typescript-standards` (typing of the extracted/adopted helper). Cite the relevant one per finding.

## SIGNALS (worklist pretags for E3)

This pillar depends on the **global indexes** built in E3 — build them before fan-out:

- **Normalized-snippet index** — hash comment/whitespace-stripped ≥`thresholds.minSnippetLinesForDry`-line
  blocks and repeated `className` strings; keep only buckets spanning ≥2 distinct files. These buckets
  are the primary worklist.
- **Existing-helper index** — every exported symbol in `src/utils`, `src/hooks`, `src/lib` (name + path).
- Corroborate with `depcruise.json` (high coupling / cycles) and `fta.json` (duplication/complexity).
  Drop `excludeGlobs`, claimed files, suppressed fingerprints.

## SPECIAL_HANDLING

- **Adopt before extract — this is the whole point.** For every cluster, the E5 reduce agent greps the
  existing-helper index first. If a helper already does the job, `action: adopt-existing` — rewrite the
  duplicate call sites to the existing helper (`existingHelper != null`). Only `action: extract-new` when
  nothing suitable exists. This is the mechanism for "existing code adapts to newer code": do not invent
  a `formatDuration` when `src/utils` already has one.
- **Blast radius is real here.** A DRY change touches multiple files at once, so it rarely stays
  `local`. Keep each cluster to a modest call-site count, set `riskBlastRadius` honestly, and let the
  `caps.maxFilesPerPR` cap spill large clusters into follow-up PRs (or carry-over once the run's PR
  budget is spent) rather than shipping one sprawling PR — never a forgotten ticket.
- Only consolidate genuine duplication of _behavior_. Superficially similar code with diverging intent
  (coincidental shape) is a KEEP — forcing it behind one helper couples unrelated concerns.
- **Standing KEEP: v1 ↔ v2 parallel implementations.** A cluster whose participating files span the v1
  canvas (`src/components/shared/ReactFlow/**`, and the v1 `src/routes/**` views it serves) and the v2
  tree (`src/routes/v2/**`) is a **migration in progress**, not accidental duplication — v1 is slated for
  removal, and coupling the two behind one helper mid-migration is the "diverging intent" case above.
  Examples seen: `PipelineTags`/`TagsBlock`, `PipelineRun`/`RunViewV2`, `RunDetails`/`RunDetailsContent`,
  `FlexNodeEditor`/`FlexNodeDetails`, `IONode`/`IONodeCard`.
  Drop these clusters in E5 — do **not** file them as findings, and do **not** re-raise them as a
  decision-queue item (#2626 B12 closed this; re-filing it every run is the noise this rule removes).
  Duplication _within_ v1 or _within_ v2 is still in scope, as is a v1-only or v2-only cluster.
- New helpers follow project structure: `@/` imports, no barrel exports, placed in the right
  `src/utils|hooks|lib` home with a proper TypeScript signature.
