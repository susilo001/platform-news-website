# Validation record

## Verified locally during implementation

- Next.js production build and TypeScript compilation.
- Prisma client generation and complete initial migration against PostgreSQL 18.
- 71 unit tests covering all forbidden editorial transitions, roles, ownership, public visibility, unsafe content, upload signatures, and preview tampering/expiry.
- PostgreSQL integration tests for draft/review/approved visibility across article/list/search/sitemap queries, publish/unpublish, self-approval restrictions, immutable public revisions, scheduled release races/retries, canceled schedules, optimistic concurrency, mandatory hero metadata, and authorized soft deletion with retained history.
- Production dependency audit: no known vulnerabilities reported at verification time after updating Auth.js/sharp and applying the documented Prisma dependency overrides.
- Browser inspection of the homepage, newsroom dashboard, Tiptap editor input, and public search results using the read-only demo.

## Not represented as verified

Production GitHub OAuth and S3 upload require credentials that are not present in this workspace. No live production deployment, backup/restore drill, external monitoring configuration, load test, Core Web Vitals benchmark, or independent accessibility/security audit has been performed. The committed Playwright desktop/mobile suite is configured for CI; its execution results should be checked in GitHub Actions.

Demo screenshots or a successful build do not establish production readiness. Follow [operations](operations.md) before launch.
