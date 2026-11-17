# CMS with manual publishing on free tiers

Use the existing `platform-news-website` Render web service with Neon PostgreSQL, Google OAuth, and Cloudflare R2. Keep the Render instance on **Free**. No background worker or paid Render database is created by this setup. Provider quotas still apply; R2 bills excess storage/operations and can require billing details. This is a small project setup, not an always-on production availability commitment.

## 1. Create the database

Create a project on [Neon Free](https://neon.com/pricing), preferably near Singapore. Select PostgreSQL and keep the Free plan. In **Connect**, select the direct/unpooled connection and copy its PostgreSQL URL into Render's `DATABASE_URL` secret field. Keep `sslmode=require`. This single-instance Prisma 6 setup uses the direct connection for both runtime and migrations; do not follow Prisma 7 adapter instructions or change dependency versions.

For the small Node instance, append `connection_limit=5&connect_timeout=30` to the URL query, using `&` when a query already exists. Preserve all existing Neon parameters. Never post the URL in chat or commit it.

## 2. Create the Google login application

In [Google Cloud Console](https://console.cloud.google.com/), create or select a project, then open **Google Auth Platform**. Configure Branding and Audience for the application. For a personal Gmail account, choose **External**. While the app is in Testing, add each staff Google account as a test user. The CMS invitation list is a separate requirement; a Google test user alone does not grant CMS access.

Under **Clients**, create an OAuth client with application type **Web application**:

| Field                        | Value                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| Name                         | Platform News CMS                                                     |
| Authorized JavaScript origin | `https://platform-news-website.onrender.com`                          |
| Authorized redirect URI      | `https://platform-news-website.onrender.com/api/auth/callback/google` |

Use a separate client for local development with callback `http://localhost:3000/api/auth/callback/google`. Use only the standard `openid`, `email`, and `profile` sign-in scopes; Gmail API access is not needed.

Copy the client ID to Render's `AUTH_GOOGLE_ID` and enter the client secret directly as `AUTH_GOOGLE_SECRET`. Set `ADMIN_EMAIL` to the exact verified email of the Google account you will use. The seed creates this admin and categories; it does not publish sample articles or change existing staff roles. Other staff must be invited in the CMS before they can sign in. Unverified email profiles, uninvited users, and inactive staff cannot sign in.

After merging the Google sign-in PR, replace the old `AUTH_GITHUB_*` variables with `AUTH_GOOGLE_*` in Render. The callback URL must use `/google`. If the initial admin was already seeded under a different email, invite the new Google email through an existing admin session before switching providers; changing `ADMIN_EMAIL` does not remove the old admin. The seed creates a new admin only if that email is absent and does not upgrade existing staff roles. No article database migration is needed for the provider switch.

## 3. Configure image storage

Create a dedicated Standard R2 bucket, for example `platform-news-media`, in [Cloudflare R2](https://developers.cloudflare.com/r2/get-started/). Review billing before enabling R2; an included allowance is not a hard spending cap.

Create an S3 API token with **Object Read & Write** restricted to this bucket. Enter its Access Key ID and Secret Access Key directly into Render. Use the S3 endpoint Cloudflare shows (not a public image URL). Set `S3_REGION=auto`.

For initial testing, enable the bucket's public development URL and use that exact URL as `MEDIA_PUBLIC_URL`. Anyone with an object URL can read that media: upload only images intended for public publication. The `r2.dev` URL has rate limits and is not intended for production traffic; use an R2 custom domain for a public launch. Custom domain registration may cost money. Keep API write access private. This app uploads through its authenticated server, so broad browser-upload CORS is unnecessary.

## 4. Add Render environment variables

Open the **existing service → Environment** and set these values. Keep demo mode enabled until all credentials are entered and you are ready to redeploy.

| Variable                  | Value                                              |
| ------------------------- | -------------------------------------------------- |
| `NODE_VERSION`            | `22`                                               |
| `NODE_ENV`                | `production`                                       |
| `HOSTNAME`                | `0.0.0.0`                                          |
| `DEMO_MODE`               | `false` when ready to switch                       |
| `SCHEDULING_ENABLED`      | `false`                                            |
| `SITE_URL`                | `https://platform-news-website.onrender.com`       |
| `AUTH_URL`                | `https://platform-news-website.onrender.com`       |
| `DATABASE_URL`            | Neon direct PostgreSQL URL, kept secret            |
| `ADMIN_EMAIL`             | Your verified Google sign-in email                 |
| `AUTH_GOOGLE_ID`          | OAuth application client ID                        |
| `AUTH_GOOGLE_SECRET`      | OAuth application client secret                    |
| `AUTH_SECRET`             | A unique, random secret of at least 32 characters  |
| `PREVIEW_SECRET`          | A separate random secret of at least 32 characters |
| `S3_ENDPOINT`             | The bucket's S3 API endpoint from Cloudflare       |
| `S3_REGION`               | `auto`                                             |
| `S3_BUCKET`               | Your R2 bucket name                                |
| `S3_ACCESS_KEY_ID`        | Bucket-scoped Access Key ID                        |
| `S3_SECRET_ACCESS_KEY`    | Bucket-scoped Secret Access Key                    |
| `MEDIA_PUBLIC_URL`        | Public bucket URL or R2 custom-domain origin       |
| `NEXT_TELEMETRY_DISABLED` | `1`                                                |

Generate the two random secrets independently in your own terminal with `openssl rand -base64 32`, or use a password manager's secure generator. Never send them in chat. `AUTH_URL` pins the canonical origin; the installed Auth.js version also treats it as a trusted host. Do not add arbitrary forwarded hosts.

If this service is managed by a Blueprint, update its source of truth so a future Blueprint sync cannot restore `DEMO_MODE=true`. The repository's default `render.yaml` deliberately remains a demo template; changing it globally would switch other demo installations. Keep service-specific live credentials in Render, never in YAML committed to GitHub.

## 5. Deploy the prepared code

After merging the manual-publishing setup PR, select `main` in the existing service's Settings. Set:

```text
Build Command: npm ci --include=dev && npm run build:cms
Start Command: npm run start:render
Health Check Path: /api/health
Instance Type: Free
```

`build:cms` generates Prisma Client, applies committed migrations, idempotently seeds the admin/categories, and builds the standalone app. Free Render services lack the paid pre-deploy release task, so this small-project setup applies migrations during build. Builds may mutate the database even if a later step fails: use backward-compatible migrations and run one deployment at a time. Never use `prisma migrate reset` on the hosted database. Keep `SEED_SAMPLE_DRAFTS` unset.

Set `DEMO_MODE=false` and redeploy. The public website initially has no real stories; the earlier demo stories are fixtures, not database content. Upload a licensed hero image, create a draft, submit for review, approve, and **Publish now**. A single initial admin can approve their own article only with an explicit editorial reason; invite another editor for normal review.

## 6. Verify and maintain

- `/api/health` should return HTTP 200 with `status: ok`; `demo` means demo mode is still enabled.
- Open `/cms/login`, sign in with the seeded Google account, and confirm the CMS loads.
- Upload an image with alt text and verify its public URL loads.
- Publish a real article and confirm the homepage, category, search, and direct article URL show it. Unpublish and confirm those surfaces hide it.
- Confirm scheduling controls are absent. The server rejects scheduling requests when `SCHEDULING_ENABLED=false`; Publish now and Unpublish still use the normal approval and authorization checks.

No background tasks run on this deployment. Public pages read committed publication data directly, so manual publication does not need an outbox consumer to become visible. Outbox events and expired rate-limit rows still accumulate: periodically run `npm ci --include=dev`, `npm run db:generate`, and `npm run maintenance` from a trusted checkout with the database URL supplied through your local secret environment. Maintenance logs queued publication events as processed and deletes only expired rate-limit counters; it never runs scheduled publishing or deletes audit/revision records. Keep database backups separately.

If schedules already exist from a previous worker deployment, return them to draft before removing the worker. Turning scheduling off does not discard pending jobs or hide overdue-job health failures. To add scheduling later, provision and verify a worker before setting `SCHEDULING_ENABLED=true`.

Render and Neon can both sleep when idle. Cold requests may be slow, and free quotas can interrupt service. Monitor each provider's usage. For launch requirements, see [Operations](operations.md).

References: [Render Free](https://render.com/docs/free), [Neon Prisma guide](https://neon.com/docs/guides/prisma), [R2 S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/), [R2 public URLs](https://developers.cloudflare.com/r2/buckets/public-buckets/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Auth.js deployment](https://authjs.dev/getting-started/deployment).
