# Architecture

## Runtime and module boundaries

One Next.js modular monolith serves public Server Components, the private CMS, Server Actions, and Route Handlers. PostgreSQL is the source of truth. A separate Node process polls durable publication jobs every 30 seconds; Redis is not required.

| Location                         | Responsibility                                                 |
| -------------------------------- | -------------------------------------------------------------- |
| `src/app/(public)`               | Reading, discovery, author/category pages, metadata            |
| `src/app/cms/(workspace)`        | Authenticated editorial screens                                |
| `src/app/cms/actions.ts`         | Authenticated action adapters and administrative mutations     |
| `src/modules/articles`           | Schemas, structured content, article services, scoped queries  |
| `src/modules/workflow/policy.ts` | Testable role/ownership rules and state machine                |
| `src/modules/auth/session.ts`    | Session validation and current active staff lookup             |
| `src/modules/media`              | Image validation; upload orchestration in `/api/media`         |
| `src/modules/publishing`         | Transactional schedule processing and outbox consumer          |
| `src/lib`                        | Database, configuration, storage, previews, rate limits        |
| `src/components`                 | Shared reading and CMS interface components                    |
| `prisma`                         | Database schema, initial migration, explicit bootstrap seed    |
| `worker`                         | Worker lifecycle, polling, structured errors, graceful signals |
| `tests`                          | Unit, PostgreSQL integration, and browser scenarios            |

## Editorial consistency

Article revisions are append-only through application services. Each save checks the article version and uses a serializable transaction. Successful saves create a revision, atomically change the current revision pointer, update bylines/tags, and append an audit event. Conflicting saves fail visibly instead of overwriting another editor's work.

Approvals point at a specific revision. Publication requires that the approved and current pointers agree, then stores a separate published-revision pointer. Public reads always require `PUBLISHED`, a nonfuture publication date, an existing public revision, and no soft-deletion timestamp. The renderer uses that public revision rather than whatever a writer most recently edited.

Published articles cannot be edited in place. The controlled MVP correction path unpublishes the story, returns it to draft, and requires another review. A later release could retain the public original while a separate correction branch goes through review.

Scheduling creates a database job in the same transaction as the status change. Workers claim due rows with `FOR UPDATE SKIP LOCKED`; a conditional article update checks status, revision pointers, and due time. Article publication, job completion, audit event, and outbox event commit together. Repeated or concurrent jobs cannot publish twice. Canceling a schedule marks pending jobs canceled.

Soft-deleting a draft retains revisions and decisions. It removes the article from CMS queries, previews, and editing services. Slugs remain reserved to avoid accidental URL reuse.

## Caching and search decision

The initial implementation deliberately uses **dynamic public reads**. Story visibility, sitemap, and PostgreSQL full-text search read the same committed state, so unpublishing takes effect on new requests without depending on a cache-invalidation worker. This differs from the PRD's planned shared data cache. Introduce a cache only with explicit invalidation/visibility tests and measured need; no Core Web Vitals claim is made for the current implementation.

PostgreSQL GIN indexes match the title/summary/body-text search expression. Queries use bound parameters, server-side limits/offsets, and a separate full match count. Search results and other lists sort deterministically by publication time and ID. Search terms are bounded to 200 characters. Public lists use nine stories per page; CMS lists show up to 100 recently updated stories, with a visible limit. Media and revision lists are also bounded.

Publication outbox events are durable integration points. The current consumer emits structured completion logs and acknowledges events. It does not claim to update a separate search index or shared cache, because neither exists. Add idempotent consumers before introducing downstream infrastructure.

## Authentication and permissions

Auth.js uses GitHub OAuth with an allowlist of individual staff emails. Staff must be pre-invited by an admin and must have a matching verified GitHub email. No password database or open registration exists. JWT sessions expire after eight hours; each sensitive request re-queries the user to apply deactivation and role changes immediately.

Every action and media route authenticates independently. Draft ownership belongs to the lead author; credited coauthors do not automatically gain edit access. Editors/admin can edit other drafts. Approval disallows both lead-author and coauthor self-approval; admin override requires a reason. Administrative policies protect staff/role and site-setting changes.

Next.js Server Actions supply CSRF origin checks. The multipart upload handler additionally validates Origin, rate limits staff uploads, caps total streamed request bytes, verifies image signatures/MIME, limits pixel dimensions, and re-encodes decoded images as WebP. The browser uploads through this validated server route instead of writing directly with signed S3 URLs: an intentional MVP simplification to ensure validation happens before persistence.

Signed previews bind a revision, article, actor, and expiry with HMAC-SHA256. Verification checks current actor access, uses constant-time signature comparison, and rejects expired/malformed tokens. Preview pages are dynamic, no-store, no-referrer, and noindex.

## Dependency choices

Auth.js 5 is pinned to the security-patched beta release used by this implementation. Reassess its release status before launch. Prisma 6 remains pinned to avoid an unplanned adapter/migration change; patched `deepmerge-ts` and `effect` transitive versions are explicitly overridden and verified by generation/build/integration tests. Review these overrides on Prisma upgrades.

UI primitives are native semantic elements with Tailwind available and a shared CSS design system. No shadcn component generator was needed for this first implementation. Rich text uses a structured allowlisted renderer rather than rendering stored HTML.
