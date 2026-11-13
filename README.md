# The Current · News Platform

A single-publisher news website and editorial CMS built from [PRD v1.1](docs/prd.md). Next.js App Router, TypeScript, PostgreSQL, Prisma, Auth.js, Tiptap, Tailwind CSS, and S3-compatible media storage. No separate API service and no multi-tenancy.

## Explore the design

```bash
npm ci
npm run dev
```

With no `DATABASE_URL` in development, public pages use **clearly labelled sample content**. Visit `/` for the publication and `/demo` for a read-only newsroom. The editor accepts local input, but demo saving, publishing, uploads, and sign-in are disabled. Nothing is stored in the browser. An explicit `DEMO_MODE=true` also enables this mode; do not use it for a live newsroom.

**Node.js 22.12+ required.** No database is needed to build the app or explore the demo.

## Start a real newsroom

1. Copy `.env.example` to `.env`. Set `DEMO_MODE=false`.
2. Start local infrastructure:

   ```bash
   docker compose up -d
   ```

   This creates PostgreSQL and a development MinIO bucket. Local credentials in the Compose file are for development only. Services bind to localhost.

3. Create a GitHub OAuth App. Set its callback URL to `http://localhost:3000/api/auth/callback/github`. Put the client ID/secret in `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. Use a separate OAuth App for production with the production callback URL.
4. Generate **two different** random secrets (`openssl rand -base64 32`) for `AUTH_SECRET` and `PREVIEW_SECRET`. Set `ADMIN_EMAIL` to the verified email on the GitHub account that should administer the publication.
5. Apply migrations and seed the initial admin/categories:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   Seeding does not publish articles or reset existing staff permissions. `SEED_SAMPLE_DRAFTS=true npm run db:seed` optionally creates three illustrative drafts; they need your own hero images before submission.

6. Start the app and, in a separate terminal, the publishing worker:

   ```bash
   npm run dev
   npm run worker
   ```

7. Visit `/cms/login`, sign in with the invited GitHub email, and add journalists/editors in **Team members**. Invitations grant sign-in access; no email is sent. Share the sign-in URL with staff directly.

## Editorial rehearsal

1. A journalist creates a draft, adds a category, summary, body, hero image, and alt text, then saves it.
2. The journalist submits the **saved revision** for review. Save local edits before submitting.
3. A different editor approves it, or requests changes with a reason. Coauthors cannot self-approve. An admin can override self-approval only with a recorded reason.
4. An editor publishes immediately or chooses a future local time; the browser converts it to UTC. Keep the worker running for scheduled releases.
5. Visit the story, category, author, search, and sitemap routes. Only the committed published revision is visible.
6. To correct a live story: unpublish with a reason, return to draft, save a new revision, and repeat review/approval. This intentionally takes the original story offline during correction.
7. Deleting a draft requires an editorial reason and performs a **soft delete**. Revisions and audit records remain available for operational recovery.

## Routes

| Public                        | Staff                                        |
| ----------------------------- | -------------------------------------------- |
| `/`                           | `/cms` dashboard                             |
| `/news/[slug]`                | `/cms/articles` and `/cms/articles/new`      |
| `/category/[slug]`            | `/cms/articles/[id]/edit`                    |
| `/author/[slug]`              | `/cms/review`, `/cms/media`                  |
| `/search?q=...`               | `/cms/categories`, `/cms/users`              |
| `/about`                      | `/cms/audit`, `/cms/settings`                |
| `/sitemap.xml`, `/robots.txt` | `/preview?token=...` (15-minute signed link) |

`/demo` and its child routes contain only bundled sample content, independent of real staff data. `/api/health` reports database availability and schedules overdue by more than two minutes.

## Verification

```bash
npm run db:generate
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Unit tests cover roles, every forbidden workflow transition, visibility, content validation, upload signatures, and preview tampering/expiry. Integration tests exercise actual PostgreSQL transactions and concurrent workers:

```bash
TEST_DATABASE_URL=postgresql://news:password@localhost:5432/news_test npm test
```

Use a separate migrated database **whose name ends in `_test`**. Tests create isolated records and clean up only those records. Without this variable, database tests are explicitly skipped.

Browser suite (desktop Chromium and mobile WebKit):

```bash
npx playwright install chromium webkit
npm run test:e2e
```

CI provisions PostgreSQL, applies migrations, typechecks, tests, builds, and runs both browser projects. The checked-in browser suite is separate from the manual browser verification performed during implementation; see [validation](docs/validation.md).

## Deploy

The runtime needs a Node.js-compatible host or Docker, PostgreSQL, object storage, and a continuously running worker. This is a full Next.js server app, not a static export.

```bash
docker build --target web -t current-web .
docker build --target worker -t current-worker .
```

Run migrations as a release task before deploying web/worker containers. Supply production environment variables at runtime. Configure `AUTH_URL` and `SITE_URL` to your HTTPS origin. Serve the media bucket from a public HTTPS media domain. Keep bucket writes private and give the server a narrowly scoped storage identity. The upload endpoint validates, bounds, decodes, strips metadata, and re-encodes images before writing them.

Live production startup rejects missing database, OAuth, site URL, and preview-secret settings. Set `DEMO_MODE=true` explicitly if deploying only the demonstration. Never deploy the sample MinIO credentials publicly.

See [architecture](docs/architecture.md), [operations](docs/operations.md), and [PRD coverage](docs/prd-coverage.md). This implementation is ready for configuration and review; production OAuth/storage integration, performance/accessibility assessment, backups, monitoring, and editorial acceptance remain release gates.
