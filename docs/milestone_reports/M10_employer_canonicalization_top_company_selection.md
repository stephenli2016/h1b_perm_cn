# Milestone M10 Report — Employer Canonicalization + Top-Company Selection

## Status

Completed

## Built

- Added deterministic employer-name normalization for legal suffixes, punctuation, whitespace, `&`, `L.L.C.`, and related variants.
- Added TypeScript fixture helpers to resolve aliases, calculate company-page metrics, rank top company candidates, and decide data-readiness for indexation.
- Added Python ETL canonicalization builder that reads normalized LCA, PERM, and USCIS Employer Hub JSONL and writes auditable employer, alias, and company-candidate JSONL outputs.
- Added exact-match manual alias seed support for obvious large-employer variants; seeds do not create company pages unless official records contain matching raw names.
- Added tests proving low-confidence/fuzzy merges are not automatic.
- Documented canonicalization, confidence scores, scoring, and noindex/indexable data thresholds.

## Files changed

- `data/manual/employer_alias_seeds.json`
- `docs/EMPLOYER_CANONICALIZATION.md`
- `docs/ETL.md`
- `docs/SCHEMA.md`
- `etl/cli.py`
- `etl/employer_canonicalization.py`
- `lib/db/local-repository.ts`
- `package.json`
- `tests/etl/test_employer_canonicalization.py`
- `tests/local-repository.test.ts`

## Validation

- Command: `pnpm etl:test`
- Result: pass, 46 Python ETL tests.

- Command: `pnpm test`
- Result: pass, 24 Vitest tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass on isolated rerun. A concurrent run with `pnpm build` briefly failed because `.next/types` was being regenerated during the build.

- Command: `pnpm format`
- Result: pass after `pnpm format:write`.

- Command: `pnpm build`
- Result: pass, Next.js production build completed.

- Command: `pnpm etl:companies:fixtures`
- Result: pass, generated 3 employer candidates, 8 aliases, 3 candidate rows, and 0 indexable fixture companies.

- Command: `pnpm etl:validate`
- Result: pass, source manifest validated with 15 sources.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2`
- Result: pass, no local secrets detected.

## Screenshots / local URLs

- Not applicable; M10 was a data and helper milestone with no new public UI route.

## Decisions made without owner input

- Used exact normalized-name matching as the only automatic merge rule.
- Used confidence `1.0` for manual exact seeds and `0.96` for exact normalized official-source matches.
- Kept low-confidence/fuzzy or parent-subsidiary style matches out of automatic merging.
- Used conservative M10 data-readiness thresholds: 10 recent LCA records, 3 recent PERM records, or 3 recent USCIS Employer Hub rows.
- Kept current fixture candidates noindex because sample sizes are intentionally small.

## Known limitations

- M10 does not perform fuzzy matching, parent/subsidiary rollups, or brand-family grouping.
- Manual seed list is intentionally small and exact-match only.
- M10 indexability is data-readiness only; later SEO milestones still need visible page-content quality checks and sitemap exclusion logic.
- Fixture outputs under `data/normalized/` are generated local artifacts and remain ignored by Git.

## Owner action needed

None.

## Recommended next milestone

M11 — Public query API and repository layer.
