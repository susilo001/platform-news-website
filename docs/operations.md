# Operations and release gates

## Infrastructure

Deploy a stateless Next.js Node web service and a separate continuously running worker against the same PostgreSQL database. Store uploads in a private-write/public-read S3 bucket (or a public CDN origin backed by that bucket). No persistent application filesystem is required. Use HTTPS and production OAuth credentials.

Run `npm run db:migrate` once as a release task. The initial schema includes revision/byline uniqueness, one lead byline per article, positive media dimensions, publication lookup indexes, and a GIN full-text index. Future migrations should use expand/contract changes so web and worker versions can coexist.

## Configuration

Required live startup values: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `SITE_URL`, and `PREVIEW_SECRET`. Configure `AUTH_URL` to the exact canonical HTTPS origin. Configure `S3_*` and `MEDIA_PUBLIC_URL` before enabling uploads. For self-hosted multi-instance builds, use a stable shared `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as described by Next.js, supplied during builds through your secrets manager.

Use least-privilege database and object-storage credentials. Set reverse-proxy request limits for `/api/media` to about 9 MB. The application additionally caps streamed upload bytes and file/pixel sizes. Strip untrusted forwarded headers at the edge; public search rate limits rely on the trusted forwarded client IP. Add edge rate limits for OAuth endpoints and public traffic. Application login and media/search counters use PostgreSQL; the worker cleans expired buckets.

## Monitoring

- Monitor `/api/health`: 200 `ok` when the database is available and publication jobs are on time; 503 for database failure or jobs over two minutes late. Demo mode reports `demo` and should never count as live-newsroom health.
- Alert on structured `worker.failed` logs, sustained overdue jobs, database connection failures, upload errors, and web 5xx responses.
- Set restart policies for both services. Workers retry uncommitted jobs with bounded polling backoff. Failed transactions leave jobs pending, and multiple workers can safely share the queue.
- Track outbox age and worker heartbeat externally. Current logs are JSON; external OpenTelemetry export/error tracking is a remaining integration, not a configured service.

## Backup and recovery

Before launch, configure managed PostgreSQL backups, point-in-time recovery, and object-store versioning/lifecycle rules. Perform a restore drill in an isolated environment and record the recovery time and recovery point. No production backup job is provisioned by this repository.

Keep audit and revision retention policy explicit. A deleted draft has `deletedAt` set and is excluded from normal access; an operator may restore it by clearing that field after checking editorial authorization. Record a separate audit event for operational recovery. Never delete revision/audit rows as an incidental cleanup task.

## Editorial rollout

Create one initial admin from `ADMIN_EMAIL`, invite at least one journalist and a different editor, then rehearse create → save → review → approve → schedule → publish → unpublish. Check new anonymous requests to article, category, author, search, and sitemap routes after every visibility change. Test deactivating a signed-in user and changing a role.

Use your own licensed media and real bylines. Demo stories and names are fictional/illustrative; do not treat them as reported news. Sample image URLs are hosted by Unsplash and are not copied into the production bucket.

## Outstanding production acceptance

1. Run GitHub OAuth sign-in and denied/deactivated-account checks against configured provider credentials.
2. Exercise image upload end-to-end against the chosen S3 vendor, including malformed and oversized requests.
3. Run the Playwright desktop/mobile suite in CI and an accessibility audit on real content.
4. Measure LCP/INP/CLS on representative mobile connections and traffic; add caching/image delivery improvements based on results.
5. Provision backups, tested recovery, external alert routing, and tracing/error reporting.
6. Review dependency updates, Auth.js beta risk, security headers/CSP strategy, secrets, and host/proxy configuration.
7. Complete the newsroom publication rehearsal with real staff and get editorial acceptance.
