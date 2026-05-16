# Public Query API — M11

Milestone: M11 — Public query API and repository layer

## Purpose

M11 adds a typed server-side query facade for public pages and tools. It wraps local fixture data now and can later be backed by Supabase/Postgres without changing page-facing function shapes.

Implementation:

- `lib/db/public-query-repository.ts`

The M11/M13/M14 layer does not build SQL strings and does not perform direct database access. It reads normalized fixture arrays through typed helpers, which keeps the current milestone free of unsafe SQL interpolation.

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

### `searchH1BRecords`

Returns paginated H-1B LCA directory rows for `/h1b`.

Supported filters:

- `employer`
- `fiscalYear`
- `state`
- `city`
- `jobOrSoc`
- `caseStatus`
- `page`
- `pageSize`

The payload includes normalized filters, pagination metadata, available filter options, source names, latest data date, a Chinese interpretation note, and an SEO object that keeps directory and filter URLs `noindex`.

### `searchPermRecords`

Returns paginated PERM directory rows for `/perm`.

Supported filters match `searchH1BRecords`, with PERM-specific case statuses and PERM interpretation copy.

### `searchCompanyDirectory`

Returns paginated combined company directory rows for `/companies`.

The query applies the same filters across H-1B LCA and PERM rows, aggregates matched records by employer, and returns H-1B count, PERM count, latest fiscal year, top job titles, top locations, and current company-page indexability signal.

### `listCompanySlugs`

Returns all fixture-backed employer slugs that can render through dynamic company routes.

### `listCompanyStaticSlugs`

Returns mode-specific company slugs selected for static pre-generation:

- `/h1b/company/[slug]`
- `/perm/company/[slug]`

M16 uses this method to pre-generate only selected indexable route pages, capped at 500 by default. Other valid company slugs can still render dynamically and stay `noindex` when they do not meet route-specific quality thresholds.

### `getCompanyProfileBySlug`

Returns the combined company-page payload for one employer.

The payload includes:

- Canonical employer and aliases.
- H-1B/LCA summary.
- PERM summary.
- USCIS Employer Data Hub summary.
- Fiscal-year summary rows.
- Recent H-1B LCA rows.
- PERM timeline rows.
- Wage distribution from annualized H-1B wage fields.
- Job title and worksite location breakdowns.
- Related companies, job titles, and locations for internal links.
- Source names, latest data date, interpretation note, and company-page SEO metadata.

The method is intentionally combined so H-1B and PERM company pages can share one template while still using route-specific titles, breadcrumbs, canonical URLs, and robots metadata.

M15 adds route-specific quality decisions through `getCompanyPageSeo(metrics, mode)`. The profile payload exposes the neutral score and matched thresholds; each route then decides whether the H-1B or PERM page is indexable.

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
- Directory text filters are length-limited.
- Directory pages must be positive integers.
- Directory fiscal years must be four-digit years in a bounded range.
- Directory case statuses must be supported by the selected dataset.
- Month keys must be `YYYY-MM`.
- SOC codes must match `NN-NNNN`.
- State codes must be two uppercase letters after normalization.
- Search limits are bounded.

Invalid input returns a typed error instead of throwing.

## Fixture Boundaries

The query layer currently reads local fixture data only. It is ready for pages to consume but still inherits all fixture limitations:

- Small sample sizes.
- No production Supabase connection yet.
- Only the local high-data fixture can currently satisfy a default company-page route threshold.
- M16 scale behavior is validated with generated local fixtures only; production-scale official data is still required before launching 500 real company pages.
- Company routes use M15/M16 quality and selection logic: low-data routes remain noindex, and only selected route-specific indexable pages enter the company sitemap.
