# Public Query API — M11

Milestone: M11 — Public query API and repository layer

## Purpose

M11 adds a typed server-side query facade for public pages and tools. It wraps local fixture data now and can later be backed by Supabase/Postgres without changing page-facing function shapes.

Implementation:

- `lib/db/public-query-repository.ts`

The M11 layer does not build SQL strings and does not perform direct database access. It reads normalized fixture arrays through typed helpers, which keeps the current milestone free of unsafe SQL interpolation.

## Repository Creation

```ts
import { createPublicQueryRepository } from "@/lib/db/public-query-repository";

const repo = createPublicQueryRepository();
```

Tests can inject fixture data:

```ts
const repo = createPublicQueryRepository({
  data: customFixtureData,
  cacheEnabled: false,
});
```

## Result Shape

All public queries return a discriminated union:

```ts
type PublicQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PublicQueryError };
```

Errors are designed to be page-friendly:

```ts
type PublicQueryError = {
  code: "empty_data" | "invalid_input" | "not_found";
  messageZh: string;
  field?: string;
  hintZh?: string;
};
```

Pages should display `messageZh` and may use `hintZh` for secondary helper text.

## Query Functions

### `searchEmployers`

Searches canonical employer names and aliases.

Validation:

- `query` must contain at least 2 characters.
- `limit` must be a positive integer and is capped at 50.

### `getEmployerBySlug`

Returns the canonical employer entity for a safe slug.

Validation:

- Slug must contain only lowercase letters, numbers, and hyphens.
- Path fragments such as `../` are rejected before lookup.

### `getH1BSummaryByEmployer`

Returns a public H-1B/LCA + USCIS Employer Hub summary for one employer.

Public interpretation note:

- LCA and USCIS Employer Data Hub rows are data signals only.
- They do not represent individual approval, hiring, or future sponsor promises.

### `getPermSummaryByEmployer`

Returns a PERM summary for one employer.

Public interpretation note:

- PERM certification is a labor-certification record.
- It is not I-140, I-485, consular processing, or green-card approval.

### `getWageDistribution`

Returns annualized H-1B wage distribution from fixture LCA records.

Supported filters:

- `employerSlug`
- `jobTitle`
- `city`
- `state`
- `socCode`

The payload includes count, min, p25, median, p75, max, fiscal years, top job titles, top locations, and a Chinese low-sample warning when fewer than 3 records match.

### `getRelatedEntities`

Returns related employers, job titles, and locations for a company page.

Current fixture strategy:

- Shared job title: +2
- Shared SOC code: +2
- Shared city/state: +1

This is only an internal-linking signal, not a recommendation or quality judgment.

### `getVisaBulletinDates`

Returns Visa Bulletin rows for the latest fixture month or a requested `YYYY-MM` month.

Supported filters:

- `monthKey`
- `category`: `EB-1`, `EB-2`, `EB-3`
- `chargeabilityArea`: currently only `china-mainland`

## Caching Strategy

Each repository instance has an in-memory cache:

- Default TTL: 5 minutes.
- Cache key: query namespace + fixture data signature + sorted input JSON.
- Cache stores both success and friendly failure results.
- `cacheStats()` exposes hit/miss counters for tests and diagnostics.
- `clearCache()` resets instance cache and counters.

This is intentionally simple and server-process local. Later production work can replace it with Next.js `cache`, `unstable_cache`, database-level caching, or edge/CDN caching.

## Input Safety

M11 validates public inputs before lookup:

- Slugs reject path traversal and unsupported characters.
- Month keys must be `YYYY-MM`.
- SOC codes must match `NN-NNNN`.
- State codes must be two uppercase letters after normalization.
- Search limits are bounded.

Invalid input returns a typed error instead of throwing.

## Fixture Boundaries

The query layer currently reads local fixture data only. It is ready for pages to consume but still inherits all fixture limitations:

- Small sample sizes.
- No production Supabase connection yet.
- Company pages remain noindex until later SEO quality milestones.
