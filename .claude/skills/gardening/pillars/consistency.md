# Pillar: consistency — converge divergent implementations onto the canonical one

Finds places that do the **same conceptual job a different way** than the rest of the codebase and
migrates the minority onto the canonical form. This is the pillar that catches "the v2 editor
hand-rolls a Suspense fallback while every other async boundary uses `SuspenseWrapper`" — a class of
finding the other pillars structurally cannot see, because it requires comparing files **against each
other**, not against a fixed catalog of line-level patterns.

Complementary to `dry`: `dry` consolidates duplicated **text/logic** into a shared helper;
`consistency` migrates divergent **implementations of one concept** onto the canonical one even when
they share no literal text (a bare `<Suspense>` and a `SuspenseWrapper` are not textual duplicates).

## Pillar spec

- **PILLAR_ID:** `consistency`
- **CATEGORY_IDS:** `consistency` (threshold + flags from that block in `.github/gardening-config.json`)
- **CONVENTION_SKILLS:** `react-patterns`, `project-conventions`, `typescript-standards` — the
  **existing** skills whose rules a finding cites. This pillar never invents a rule: every applied
  finding cites the `conventionRef` named by its registry entry (e.g. `react-patterns#suspense`). The
  convergence _procedure_ below is pillar handling, not a new rule (mirrors `dry`'s "adopt before
  extract").
- **DATA:** `.claude/skills/gardening/canon-registry.md` — the human-curated concept → canonical map.
  Load it at E0 (as `react` loads `react-compiler.config.js`). If it is missing or has zero entries,
  the pillar runs in **propose-only** mode: it builds the empirical index and writes decision-queue
  proposals, but applies nothing.

## SIGNALS (worklist pretags for E3)

This pillar is **index-driven**, not grep-catalog-driven — that is the whole point. Build the
**global concept index** in E3 before fan-out:

- **Registry concept index** — for each entry in `canon-registry.md`, run its `detector` greps to
  enumerate **every** site of that concept across `src` (canonical _and_ divergent alike). Classify
  each site as `canonical | deviation:<signature> | exception`. The `deviation` sites are the primary
  worklist.
- **Empirical idiom index (discovery)** — independently of the registry, bucket recurring
  structural shapes by concept (e.g. all async-boundary sites, all empty-state renders) and compute,
  per concept, the **dominant idiom** and its share. This surfaces _undocumented_ conventions the
  registry does not yet cover.
- Corroborate with `depcruise.json` (who imports the canonical module vs. who re-implements it).
- Drop `excludeGlobs`, claimed files, suppressed fingerprints as usual.

Prefer whole-concept coverage over recency: a consistency sweep is only meaningful if it sees **all**
sites of a concept, so this pillar's scoring gives **no `churnRecencyBoost`** — a five-year-old
outlier is exactly what it exists to find. Rank by `deviationClarity × (1/blastRadius)`, registry-backed
before empirical.

## SPECIAL_HANDLING

The convergence rule — a candidate deviation is only actionable when **all** hold:

- **The concept is one thing, not superficially-similar things.** Shared syntax (`uses a <div>`) is
  not shared intent. Bucket by conceptual job, not by tokens.
- **A canonical form is dominant.** Either a **registry entry** exists, or the empirical majority is a
  **supermajority** — ≥ `consistency.supermajorityRatio` of sites (default 0.75) across ≥
  `consistency.minConceptSites` sites (default 4). Two-vs-two is a coin toss → KEEP.
- **The migration is behavior-preserving**, or its delta is small, bounded, and disclosed (same bar as
  the `react` pillar's primitive swaps: mechanical mapping, no semantic change). Set
  `behaviorPreserving` honestly; non-preserving → hard-dropped in E6 like every pillar.
- **The deviation is not a deliberate exception.** A site diverges legitimately when it has a
  requirement the canonical form cannot meet (documented in a nearby comment or self-evident from the
  code). Registry `exceptions` and such sites are KEEP — record them so they are not re-flagged.

Application policy (the core guardrail against sweeping slop):

- **Registry-backed + `apply: yes` + behavior-preserving** → migrate in the draft PR, citing the
  entry's `conventionRef`. These are the only auto-applied consistency findings.
- **Registry-backed + `apply: flag`** (e.g. fallback-content swaps that can shift pixels) → draft PR
  **only** with the `requiresVisualReview` checkbox, or the decision queue if uncertain. When in doubt,
  propose.
- **Empirical supermajority with no registry entry** → **never migrate.** Write a single decision-queue
  proposal per concept: "promote to canon-registry.md — N of M sites already use X; deviations at
  «files»." A human blesses it into the registry; only then can a future run apply it. This is the line
  between "converge on what the codebase already decided" (objective) and "the bot invented a
  convention and enforced it repo-wide" (slop).

Blast radius is real: a concept migration can touch many files. Keep each PR to one concept, set
`riskBlastRadius` honestly, and let `caps.maxFilesPerPR` spill large concepts into follow-up PRs — or,
once the run's PR budget is spent, into **carry-over** (safe work the next run applies first), never a
forgotten ticket. Prefer the clearest, safest deviations first; the long tail carries over and drains
over subsequent weeks.
