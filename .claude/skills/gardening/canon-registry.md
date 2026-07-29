# Canonical pattern registry

Human-curated source of truth for the `consistency` pillar: **which recurring concepts have one
canonical implementation in this repo, and how to tell a deviation from a legitimate exception.**
The pillar reads this file at E0 (as the `react` pillar reads `react-compiler.config.js`); it never
writes it. Edit it by hand when the team settles on a way of doing something.

An entry does **not** invent a rule — it indexes an **existing** convention-skill rule and lists the
concrete deviation shapes that violate it. If a concept has no defensible convention-skill rule to
cite, it does not belong here yet; let the pillar surface it as a _decision-queue proposal_ instead (see
`pillars/consistency.md` → SPECIAL_HANDLING).

Keep this table small and true. An aspirational entry that half the tree ignores generates noise,
not cleanup — add one only when a single implementation is genuinely dominant.

## Entry schema

Each entry provides:

- **concept** — the one conceptual job (not a syntax). `conceptId` is the stable key used in
  fingerprints and the queue.
- **canonical** — the one implementation call sites should use.
- **detector** — greps that enumerate **all** sites of the concept, regardless of how each is
  written. This is what lets the pillar see a hand-rolled deviation the `SIGNALS` catalog would miss.
- **deviations** — the shapes to migrate onto `canonical`.
- **conventionRef** — the **existing** convention-skill rule the finding cites (the substantive
  authority; this registry is only the index).
- **apply** — `yes` = registry-backed and behavior-preserving ⇒ eligible for a draft-PR migration;
  `flag` = propose-to-decision-queue only (behavior delta or judgment needed).
- **exceptions** — known-legitimate divergences that must be KEPT, not re-flagged.

---

## async-boundary — loading/error UI around a suspending subtree

- **conceptId:** `async-boundary`
- **canonical:** `SuspenseWrapper` / `withSuspenseWrapper` from
  `@/components/shared/SuspenseWrapper` — it bundles the `QueryErrorResetBoundary` + `ErrorBoundary` +
  `Suspense` triad plus a default fallback, so callers never re-assemble it.
- **detector (`.tsx` under `src`):** any of `Suspense`, `SuspenseWrapper`, `withSuspenseWrapper`,
  `ErrorBoundary`, `useSuspenseQuery`, `lazy(` / `React.lazy`.
- **deviations (migrate onto canonical):**
  - a bare inline `<Suspense …>` instead of `SuspenseWrapper` (drops the error boundary and the shared
    default fallback) — **apply: yes**, additive error boundary, same subtree;
  - a hand-assembled `ErrorBoundary` + `Suspense` pair reproducing what `SuspenseWrapper` already does
    — **apply: yes**;
  - a `SuspenseWrapper`/`withSuspenseWrapper` whose `fallback` is **hand-rolled loading markup**
    (ad-hoc `<div>`/spinner JSX) rather than the shared fallback (`Spinner`) or the co-located
    `*Skeleton` the other boundaries use — **apply: flag** (swapping fallback content can shift
    rendered pixels; propose with the visual-diff checkbox rather than auto-migrate).
- **conventionRef:** `react-patterns#suspense`
- **exceptions:** route-level boundaries owned by the router (`tanstack-router`
  `pendingComponent` / `errorComponent`) — that is the router's mechanism, not a hand-rolled
  deviation. KEEP.

---

<!--
Candidates a run may PROPOSE (flag-only) until a human blesses them here. Do NOT pre-declare these
canonical — only add an entry once one implementation is actually dominant AND a convention-skill
rule authorizes it:
  - empty-state rendering
  - confirm / destructive-action dialogs
  - toast / notification calls
  - date & number formatting entrypoints
  - icon usage (raw lucide import vs the `Icon` primitive)
-->
