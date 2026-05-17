# Legal and Compliance Pages — M24

Milestone: M24 — Legal/compliance pages and correction workflow

## Public Pages

M24 adds or hardens these public pages:

- `/disclaimer` — sitewide legal/advice boundary.
- `/privacy` — MVP privacy and sensitive-data handling.
- `/terms` — usage terms draft and acceptable-use boundaries.
- `/corrections` — correction, privacy, and removal request entry point.
- `/sources` — official source registry.
- `/methodology/lca` — LCA/H-1B disclosure data methodology.
- `/methodology/perm` — PERM disclosure data methodology.
- `/methodology/wage` — prevailing wage and wage-level methodology.
- `/methodology/visa-bulletin` — Visa Bulletin and USCIS chart methodology.
- `/methodology/employer-signal` — employer public-data signal methodology.

Each page is linked through the footer and included in the compliance/core sitemap group, except `/corrections/received`, which is a noindex confirmation page.

## Draft Status

All legal/compliance copy is explicitly marked as an MVP draft. Production launch requires owner and qualified legal review before the pages are treated as final public legal terms.

The draft language reinforces:

- The site is an information and public-data explanation product.
- The site is not a law firm and does not create an attorney-client relationship.
- Tools and company pages are not H-1B, PERM, green-card, tax, career, or financial advice.
- Public data is a signal, not an approval probability, hiring guarantee, sponsor promise, or individualized legal conclusion.

## Official Source Policy

`lib/compliance/content.ts` is the M24 source registry. It lists only official `.gov` sources:

- DOL OFLC Performance Data / Disclosure Data.
- DOL/FLAG OFLC Wage Data Downloads.
- USCIS H-1B Employer Data Hub files.
- U.S. Department of State Visa Bulletin.
- USCIS Adjustment of Status filing charts.
- USCIS legal services / avoid scams guidance.

Competitor databases, forums, social media, attorney blogs, and paid databases are not data inputs.

## Correction Workflow

The MVP correction form posts to `/corrections/request`.

Current local behavior:

- Validates request type, required description, and acknowledgement.
- Redirects to `/corrections/received?status=received&type=...&id=...`.
- Generates a local public stub ID.
- Does not store records.
- Does not send email.
- Does not echo submitted description, URL, source URL, or email in the redirect.

Production behavior to add later:

- Persist to `correction_requests`.
- Add notification or review queue.
- Define retention policy.
- Define role-based access controls.
- Document privacy/security review before launch.

## Validation

M24 validation lives in `tests/compliance-pages.test.tsx` and checks:

- Draft owner/legal-review notice appears on legal pages.
- No-advice language is rendered.
- Methodology pages render official source context.
- Source registry URLs use allowed official domains.
- Correction form uses the local POST stub and avoids sensitive field names.
- POST redirects do not leak submitted descriptions or URLs.
