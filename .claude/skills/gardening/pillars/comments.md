# Pillar: comments — comment hygiene

Removes commented-out code and low-value comments (comments that restate what the code plainly does)
while preserving comments that explain a non-obvious why. **This is a per-comment judgment call, not a
mechanical rule:** assess each comment on its merit — does it explain something the code and its names
cannot? Most added comments do not and should go; any comment with a genuine purpose stays.

## Pillar spec

- **PILLAR_ID:** `comments`
- **CATEGORY_IDS:** `comments` (threshold + flags from that block in `.github/gardening-config.json`)
- **CONVENTION_SKILLS:** `project-conventions` (the Comments & Documentation policy — explain _why_,
  not _what_; keep JSDoc for public APIs; keep non-obvious reasoning). Load it and cite
  `project-conventions#comments--documentation` on every finding.

## SIGNALS (worklist pretags for E3)

**Comment density is the primary discovery signal.** The strongest, cheapest indicator of a file that
over-comments is a high **portion of comment lines**. Rank `.ts`/`.tsx` under `src` by comment-line ratio
(comment lines ÷ non-blank lines) and take the densest files as the worklist — a file that is heavily
commented is where restatement and narration cluster. Drop `excludeGlobs`, claimed files, suppressed
fingerprints, and the `src/components/ui/**` design-system primitives (their prop JSDoc is a public API
contract — KEEP). Use churn (`churn.txt`) as a secondary tie-breaker. This pillar needs no
`knip`/`fta`/`depcruise`.

Within the ranked files, these are common **shapes** to scrutinize — examples of where low-merit comments
live, **not** a mechanical checklist. Every hit is still assessed per-comment for merit (below):

- **Commented-out code** — e.g. `^\s*//\s*(const|let|var|return|import|export|if|for|function|await|console|<[A-Za-z]|\{|\}|=>)`.
  Exclude directive comments (`// eslint`, `// @ts-`, `// prettier`) and intent markers (`// TODO`,
  `// FIXME`, `// NOTE`).
- **Prop/field-definition comments** — a comment on any member of an `interface`, `type`, component
  `Props`, or config-object literal, whether _trailing_ (`^\s*[A-Za-z_]\w*\??:\s.*//`, excluding
  strings/URLs) or _leading_ (a `//`, `/* … */`, or `/** … */` comment on the line(s) above the field).
  These are usually restatement — a field that needs a comment to say _what_ it is signals a naming
  problem — but a field comment that conveys something genuinely non-obvious (a unit, an external
  constraint the type cannot express) can stay.
- **Large narrating blocks & section-divider banners** — runs of ≥2 consecutive comment lines,
  multi-line `/* */` blocks, and banners (`// ---`, `// ===`, `// ─── … ───`) that narrate _what_ the
  code does.
- **Narrating comments** — single comment lines whose adjacent code plainly restates them
  (`// loop over items` above a `.map`, `// set state`).

## SPECIAL_HANDLING

- **Assess every comment on its merit — the lean is toward removal, but it is not a strict rule.** Ask of
  each: does it explain something the code and its names cannot? If yes, KEEP; if it merely restates or
  narrates, `action: remove`. Comments that carry genuine merit — workarounds, trade-offs, gotchas,
  accessibility rationale, external constraints, named-person design notes, issue links, and
  `TODO`/`FIXME` that track real pending work — stay. Most added comments lack this and should go, but a
  comment with a real purpose is never removed just for being a comment.
- **Prop/field-definition comments** — usually restatement → `action: remove`. When the comment exists
  because the field name is poor, the fix is a rename, not a comment: record a **decision-queue** item
  `rename-field: <before> → <after>` (a rename ripples to call sites and is usually not
  behavior-preserving, so route it to a human rather than auto-apply). Keep a field comment only when it
  conveys something genuinely non-obvious the name and type cannot; always KEEP the
  `src/components/ui/**` design-system-primitive exception (public API JSDoc).
- **Large narrating blocks & section-divider banners** — narration → `action: remove`; a real _why_ that
  is over-written → `action: refine` to condense; a genuine non-obvious _why_ → KEEP.
- `action: refine` (not `remove`) for a keep-worthy comment that is merely poorly worded or has a typo.
- Comments describing `componentSpec` structure are `touchesProtected: true` — never remove.
- Removing a comment or commented-out code is behavior-preserving, so the `validate:test` gate is a
  strong safety net here; this pillar does not set `requiresVisualReview`.
