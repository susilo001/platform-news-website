# Render demo deployment

## What this provisions

`render.yaml` creates one **Free** Node web service named `platform-news-demo` in Singapore. It uses the same repository and branch selected for the Blueprint. Automatic deploys wait for GitHub checks to pass.

The deployment is an explicitly labelled, read-only demonstration. Readers can browse sample stories and explore `/demo`; saving, uploads, sign-in, and publishing are disabled. No PostgreSQL, OAuth secrets, object storage, or background worker is required. No paid service is declared.

## Deploy using the Blueprint

1. Connect Render to the GitHub account that owns `susilo001/platform-news-website`, granting this repository access.
2. In Render, create a **Blueprint** and select the repository and branch containing `render.yaml`. Use `main` after the setup PR is merged, or use the setup branch to try it before merge.
3. Confirm the plan remains **Free** and create the Blueprint. If Render requires account verification or acceptance of terms, complete that in your own account.
4. Wait for the build and deployment to complete. Open the URL returned by Render.
5. Check `/api/health` returns HTTP 200 with `{"status":"demo"}`. Open `/`, `/search`, an article, and `/demo`; styles and scripts should load normally.

If you deployed the setup branch before merge, change the service and Blueprint tracking branch to `main` after merge before deleting the setup branch.

## Equivalent manual web service settings

| Setting       | Value                                            |
| ------------- | ------------------------------------------------ |
| Type          | Web Service                                      |
| Repository    | `susilo001/platform-news-website`                |
| Branch        | Branch containing this setup; `main` after merge |
| Runtime       | Node                                             |
| Region        | Singapore                                        |
| Plan          | Free                                             |
| Build command | `npm ci --include=dev && npm run build:render`   |
| Start command | `npm run start:render`                           |
| Health check  | `/api/health`                                    |

Set `NODE_VERSION=22`, `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `DEMO_MODE=true`, and `NEXT_TELEMETRY_DISABLED=1`. Render supplies `PORT` and `RENDER_EXTERNAL_URL`. Do not set `PORT` to a different fixed value.

The application uses `SITE_URL` when provided, then `RENDER_EXTERNAL_URL`, then localhost. No manual URL entry is required for the default Render hostname. Set `SITE_URL` to the final HTTPS origin if adding a custom domain.

`build:render` builds the application and copies `.next/static` (and `public`, if present) into the standalone output. `start:render` runs the generated standalone server. Do not replace it with `next start` for this standalone deployment.

## Free-plan behavior

Render free web services sleep after 15 minutes without inbound traffic and may take around a minute to wake. Free services have usage limits and an ephemeral filesystem. The demo does not depend on local uploaded files or a local database.

This setup is for evaluation. It is not the production newsroom deployment and should not be used to promise availability or scheduled publication.

## Enable a CMS with manual publishing

See [Free CMS setup](free-cms.md) for the existing Render service, Neon, Google login, and R2. Set `SCHEDULING_ENABLED=false` when no worker is deployed.

## Enable the real CMS later

Before changing `DEMO_MODE` to `false`:

1. Configure hosted PostgreSQL and set `DATABASE_URL`; apply migrations.
2. Set `AUTH_URL` and `SITE_URL` to the deployed HTTPS origin.
3. Create the Google OAuth application with callback `https://YOUR-HOST/api/auth/callback/google`; set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. Set distinct random `AUTH_SECRET` and `PREVIEW_SECRET` values, each at least 32 characters. Set `ADMIN_EMAIL` to the initial admin’s verified Google email, then run the seed against the hosted database.
5. Configure `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `MEDIA_PUBLIC_URL` for real uploads.
6. Provision a separate publishing worker if scheduled releases are required. It is not part of this free Blueprint. Without the worker, scheduled jobs will not run and overdue jobs cause the health endpoint to report degradation.
7. Configure backups and monitoring, then perform the editorial publish/unpublish rehearsal in `docs/operations.md`.

Enter secrets directly in provider settings or an approved secret store. Do not commit them or paste them into chat. Deploying the demo does not require any of these secrets.

References: [Render Blueprints](https://render.com/docs/blueprint-spec), [Render environment variables](https://render.com/docs/environment-variables), [Render free services](https://render.com/docs/free), [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
