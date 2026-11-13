# Product Requirements Document (PRD)

## News Publisher Website & Editorial CMS

**Version:** 1.1 (Draft — single publisher, multi-journalist)\
**Date:** 10 November 2026\
**Status:** Proposed for review\
**Architecture:** Full-stack Next.js modular monolith\
**Publisher model:** Single publisher; multiple journalists and editors\
**Product working name:** The Current (placeholder)

## 1. Executive summary

Build a responsive, SEO-first digital news publisher with a public reading experience and a private editorial content management system (CMS). Editorial staff author, review, schedule, publish, update, and unpublish articles. Readers browse public articles by category, search content, and discover related stories. The MVP targets exactly one publishing organization with multiple journalist accounts and an editorial approval chain; it is not a multi-tenant SaaS.

### 1.1 Goals

- Enable editorial teams to publish accurate, formatted stories without developer assistance.
- Ensure no draft or unapproved article is publicly accessible.
- Provide fast, crawlable article and category pages with metadata and structured data.
- Maintain accountability through editorial roles, revision history, and audit events.
- Establish a maintainable Next.js-only application architecture with clear module boundaries.

### 1.2 Non-goals (MVP)

Native mobile apps; reader accounts and comments; paid subscriptions; advertising management; AI-generated news; multi-tenancy; syndication ingestion; multilingual content; advanced personalization.

### 1.3 Success metrics (initial targets, to validate)

- Editorial staff can create, submit, approve, and publish an article end-to-end.
- 100% of public article responses enforce publication visibility on the server.
- 95% of scheduled publish jobs execute within 2 minutes of intended time under normal operation.
- Public article pages target p75 Core Web Vitals: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.
- Zero critical/high authorization vulnerabilities at launch.

## 2. Personas and permissions

One publisher operates the platform. Staff accounts are individual and auditable. There are three staff roles: `ADMIN`, `EDITOR`, and `JOURNALIST`. Public readers do not require accounts.

| Capability                                | Admin | Editor | Journalist             |
| ----------------------------------------- | ----- | ------ | ---------------------- |
| Create articles and edit own drafts       | Yes   | Yes    | Yes                    |
| Edit another journalist's articles        | Yes   | Yes    | No                     |
| Submit own article for review             | Yes   | Yes    | Yes                    |
| Approve or request revisions              | Yes   | Yes    | No                     |
| Publish, schedule, or unpublish           | Yes   | Yes    | No                     |
| Manage categories and tags                | Yes   | Yes    | No                     |
| Invite, deactivate, or change staff roles | Yes   | No     | No                     |
| Change site settings                      | Yes   | No     | No                     |
| View organization analytics               | Yes   | Yes    | No (own articles only) |

**Authorization:** Check actor permissions and article ownership server-side in every Server Action, Route Handler, and database access path. UI-only restrictions are insufficient. Editors must not approve their own article submissions by default (separation of duties); Admin may override with an audit reason. Deactivated staff cannot sign in or mutate content.

**Co-authorship:** Articles may credit multiple journalists, with one designated lead author responsible for submission. Article authorship and edit permissions are separate concepts. Use an `ArticleAuthor` join table and explicit lead-author flag.

## 3. User journeys

**Reader:** open homepage → select category or featured story → read published article → navigate related stories → search for more.

**Journalist:** sign in → create draft → add title, summary, body, hero image, category, tags, SEO fields → save → submit for review.

**Editor:** open review queue → inspect article and revisions → request changes or approve → publish or schedule approved article.

**Editor:** approve an article → publish immediately or set a future publication time → scheduler releases approved revision → verify public page → unpublish or initiate correction if necessary.

## 4. Functional requirements

Priority: P0 = required for MVP; P1 = post-MVP.

| ID     | Priority | Requirement              | Acceptance criteria                                                                                                 |
| ------ | -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| PUB-01 | P0       | Homepage                 | Displays featured, latest, and category-based published articles only; empty states handled                         |
| PUB-02 | P0       | Article page             | Unique slug, title, dek, author, publish/update timestamps, hero image, formatted body, related stories             |
| PUB-03 | P0       | Category listing         | Slug-based route, server-side pagination, published content only                                                    |
| PUB-04 | P0       | Search                   | Keyword search across published title, summary and article text; paginated results                                  |
| PUB-05 | P0       | SEO                      | Canonical URLs, Open Graph, sitemap, robots, JSON-LD NewsArticle, meaningful metadata                               |
| PUB-06 | P0       | Responsive accessibility | Keyboard navigation, semantic landmarks, image alt text, responsive layouts                                         |
| CMS-01 | P0       | Authentication           | Secure login/logout, protected CMS routes, server-side session validation                                           |
| CMS-02 | P0       | RBAC                     | Every mutation and sensitive query validates actor permission and resource ownership                                |
| CMS-03 | P0       | Article CRUD             | Create/edit/list drafts with title, summary, body, slug, category, tags, author and images                          |
| CMS-04 | P0       | Rich text                | Tiptap editor with headings, links, quotes, lists, embedded images; content sanitized on render                     |
| CMS-05 | P0       | Workflow                 | Draft → In Review → Approved → Scheduled/Published; revision requests return to Draft with reason                   |
| CMS-06 | P0       | Scheduling               | Authorized editor/admin schedules future publication in UTC; job publishes once, idempotently                       |
| CMS-07 | P0       | Media library            | Upload and reuse images; validate type/size; private upload authorization; alt text required for informative images |
| CMS-08 | P0       | Taxonomy                 | Editor/admin manages categories and tags; unique slugs enforced                                                     |
| CMS-09 | P0       | Revision history         | Save immutable article revisions and actor/timestamp; show history and allow authorized restore                     |
| CMS-10 | P0       | Audit log                | Log publish, unpublish, approvals, role changes and destructive operations                                          |
| CMS-11 | P0       | Preview                  | Signed, expiring preview links show nonpublic drafts without making them indexable                                  |
| CMS-12 | P0       | User management          | Admin invites/deactivates journalist and editor accounts and assigns roles                                          |
| CMS-13 | P1       | Analytics                | Aggregate views, top stories and editorial throughput                                                               |
| CMS-14 | P1       | Editorial enhancements   | Assignments, notifications, content calendar, bulk actions                                                          |

### 4.1 Article state machine

- `DRAFT` → `IN_REVIEW` (lead journalist/editor/admin)
- `IN_REVIEW` → `DRAFT` (editor requests changes, reason required)
- `IN_REVIEW` → `APPROVED` (editor/admin, separation-of-duties check)
- `APPROVED` → `PUBLISHED` (editor/admin, publish immediately)
- `APPROVED` → `SCHEDULED` (editor/admin, future time required)
- `SCHEDULED` → `PUBLISHED` (authorized scheduler after due time)
- `SCHEDULED` → `DRAFT` (editor/admin cancels schedule for revision)
- `PUBLISHED` → `UNPUBLISHED` (editor/admin; reason required)
- `UNPUBLISHED` → `DRAFT` (editor/admin, to revise before reapproval)

Disallow all other transitions. Publication must validate required fields, approved revision, and valid hero image metadata. Editing a published story must create a new draft revision or use a controlled correction workflow, never silently alter the approved revision.

## 5. Information architecture

### Public routes

- `/` — homepage
- `/news/[slug]` — article detail
- `/category/[slug]` — category listing
- `/search?q=...` — search results
- `/author/[slug]` — author profile and published articles

### CMS routes

- `/cms/login`
- `/cms` — dashboard
- `/cms/articles` — list, filters, statuses
- `/cms/articles/new` — create
- `/cms/articles/[id]/edit` — editor
- `/cms/review` — review queue
- `/cms/media` — media library
- `/cms/categories` — taxonomy
- `/cms/users` — staff accounts
- `/cms/audit` — audit events
- `/cms/settings` — site settings

## 6. Full-stack architecture

### 6.1 Stack decisions

| Concern           | Choice                                   | Notes                                                     |
| ----------------- | ---------------------------------------- | --------------------------------------------------------- |
| Framework         | Next.js App Router + TypeScript          | One repository, full-stack deployment                     |
| Styling           | Tailwind CSS + shadcn/ui                 | Accessible, reusable UI                                   |
| Server mutations  | Server Actions                           | Authz + validation + transactional writes on server       |
| HTTP integrations | Next.js Route Handlers                   | Upload signing, webhooks, feeds, job callbacks            |
| Database          | PostgreSQL                               | Primary transactional store                               |
| ORM/migrations    | Prisma                                   | Schema, typed queries, migrations                         |
| Authentication    | Auth.js                                  | Staff-only authentication; secure cookie/session handling |
| Authorization     | Centralized policy functions             | RBAC + ownership, enforced in services                    |
| Editor            | Tiptap                                   | Store versioned structured JSON, sanitize renderer        |
| Validation        | Zod                                      | Input and environment validation                          |
| Media             | S3-compatible object storage             | Direct upload via short-lived signed URLs                 |
| Caching           | Next.js data caching/revalidation        | Cache public pages, invalidate on publication             |
| Search            | PostgreSQL full-text search              | MVP; optional Meilisearch/OpenSearch later                |
| Background jobs   | Dedicated worker/managed jobs            | Durable scheduling; not in-process setTimeout             |
| Tests             | Vitest + Playwright                      | Unit, integration and E2E                                 |
| Observability     | Structured logs + OpenTelemetry          | Traces, errors, audit events                              |
| Deployment        | Docker / Next.js-compatible managed host | PostgreSQL and object storage managed separately          |

**Redis is optional for MVP.** Add it for shared rate limits, high-volume caching, or queues only when required. Do not introduce a separate Go API service.

### 6.2 Logical modules

`auth`, `users`, `articles`, `workflow`, `taxonomy`, `media`, `search`, `publishing`, `audit`, `site-settings`.

Suggested layout:

```text
src/
  app/
    (public)/
    cms/
    api/
  modules/
    articles/{components,schemas,services,repositories,policies}/
    workflow/{services,policies}/
    auth/
    users/
    taxonomy/
    media/
    search/
    publishing/
    audit/
  components/
  lib/{db,auth,storage,observability}/
prisma/{schema.prisma,migrations/}
tests/{unit,integration,e2e}/
worker/
```

Prefer React Server Components for read-heavy public pages. Use Client Components for interactive CMS editing. Server Actions are transport adapters; business rules live in testable server-only services.

### 6.3 Publishing consistency

A publication transaction updates article state and writes an outbox event. A worker processes due schedules and outbox events idempotently. Cache revalidation, sitemap refresh and search-index updates must be retryable. Avoid treating a successful database commit as proof that downstream cache/search updates succeeded.

## 7. Data model (conceptual)

| Entity           | Key fields                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| User             | id, name, email, status, createdAt                                                                                                |
| Role / UserRole  | role, userId, roleId                                                                                                              |
| Article          | id, slug, status, leadAuthorId, categoryId, currentRevisionId, approvedRevisionId, publishedAt, scheduledAt, createdAt, updatedAt |
| AuthorProfile    | userId (unique), publicSlug, bio, avatarMediaId, socialLinks                                                                      |
| ArticleAuthor    | articleId, userId, bylineOrder, isLead; unique (articleId, userId), one lead per article                                          |
| ArticleRevision  | id, articleId, version, title, summary, bodyJson, heroMediaId, seoTitle, seoDescription, createdBy, createdAt                     |
| Category         | id, name, slug, description                                                                                                       |
| Tag / ArticleTag | id, name, slug; articleId, tagId                                                                                                  |
| Media            | id, storageKey, mimeType, sizeBytes, width, height, altText, uploadedBy                                                           |
| EditorialReview  | id, articleId, revisionId, reviewerId, decision, comment, createdAt                                                               |
| AuditEvent       | id, actorId, entityType, entityId, action, metadata, createdAt                                                                    |
| PublicationJob   | id, articleId, revisionId, dueAt, state, attempts, idempotencyKey                                                                 |
| OutboxEvent      | id, aggregateId, eventType, payload, createdAt, processedAt                                                                       |
| SiteSetting      | key, valueJson, updatedBy                                                                                                         |

Unique constraints: `Article.slug`, `Category.slug`, `Tag.slug`, `(ArticleRevision.articleId, version)`, `PublicationJob.idempotencyKey`. Index `(Article.status, Article.publishedAt DESC)`, `(Article.categoryId, Article.status, Article.publishedAt DESC)`, and `(PublicationJob.state, PublicationJob.dueAt)`.

## 8. Security and privacy

- Authenticate CMS sessions and authorize every server action, route handler, and resource lookup.
- Enforce ownership and editorial state transitions in server-only services.
- Protect preview URLs with short-lived signed tokens; add `noindex` and disable shared caching.
- Sanitize rich content and restrict embedded content to an allowlist; never render untrusted HTML directly.
- Validate uploads by content type, file signature, size and dimensions; use randomized object keys.
- Rate-limit login, search and public endpoints as appropriate.
- Use secure cookies, CSRF protections appropriate to chosen auth flow, and security headers.
- Keep credentials and storage secrets server-side; log security-sensitive mutations.
- Back up PostgreSQL and test restoration; define retention and deletion policies.

## 9. Nonfunctional requirements

- **Performance:** Meet target Core Web Vitals on representative mobile connections; optimize images and cache public pages.
- **Availability:** Initial target 99.9% monthly uptime, excluding agreed maintenance (subject to hosting SLA).
- **SEO:** Canonical URLs, structured metadata, XML sitemap and proper HTTP status for removed stories.
- **Accessibility:** Target WCAG 2.2 AA for public and CMS interfaces.
- **Scalability:** Support horizontal stateless web instances; keep job execution separate and idempotent.
- **Reliability:** Database migrations automated and reversible where feasible; backups and recovery drills.
- **Observability:** Error tracking, structured logs, traces, publishing-job alerts and audit trails.
- **Localization:** Store timestamps in UTC; display in configured publisher timezone.

## 10. Release plan

| Phase          | Deliverables                                                        | Exit gate                                    |
| -------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| 0 — Foundation | Next.js app, database schema, auth, RBAC, CI, deployment skeleton   | Staff can securely log in; migrations work   |
| 1 — Content    | CMS article CRUD, editor, categories/tags, media, revisions         | Author can save/reopen complete drafts       |
| 2 — Workflow   | Review, approval, scheduling, publication, preview, audit           | Full state machine and permission tests pass |
| 3 — Public     | Homepage, article/category/author pages, search, SEO                | Public pages show only published content     |
| 4 — Hardening  | E2E, accessibility, performance, backups, monitoring                | Launch checklist and acceptance tests pass   |
| Later          | Analytics, subscriptions, advertising, notifications, multi-tenancy | Separate discovery and prioritization        |

## 11. Critical acceptance scenarios

1. Anonymous visitor cannot retrieve draft article through URL, search, sitemap, API, or cached page.
2. Author cannot approve/publish own article without the corresponding permission.
3. Editor rejection records a reason and returns the article to a revisable state.
4. A scheduled article is published once even when a job retries or multiple workers race.
5. Unpublishing invalidates public caches and removes the article from listings/search/sitemap.
6. Published content preserves the approved revision; subsequent edits do not silently change it.
7. Invalid uploads, malformed content, and unauthorized role changes are rejected server-side.
8. Public pages render useful SEO metadata and are accessible on mobile.

## 12. Risks and mitigations

| Risk                       | Mitigation                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Draft exposure via caching | Server-side status checks, cache partitioning, no-store previews, E2E leakage tests |
| Lost scheduled publication | Durable queue/database jobs, retries, alerts, idempotency                           |
| Rich-text XSS              | Structured document schema, safe renderer, allowlisted embeds                       |
| Search becomes slow        | PostgreSQL FTS indexes first; dedicated search engine when justified                |
| Media storage cost         | Image optimization, upload limits, lifecycle rules                                  |
| Editorial conflict         | Immutable revisions, optimistic concurrency and visible edit conflicts              |

## 13. Open product decisions

1. Final publication brand and design system.
2. Single-language launch or bilingual Indonesian/English support.
3. Whether authors may publish directly or every article requires editor/publisher approval.
4. Target hosting provider, object storage vendor, and expected traffic volume.
5. Whether analytics and newsletter signups are required at initial launch.

## 14. Definition of done

MVP is complete when all P0 requirements are implemented, acceptance scenarios pass, security checks show no critical/high issues, production backups and alerts are configured, and an editorial team successfully completes a publish/unpublish rehearsal.

## 15. Single-publisher decisions and boundaries

- No `tenantId`, tenant-aware query scoping, tenant-specific domains, or tenant administration in MVP.
- Public site uses one canonical publisher domain and a single global `SiteSetting` configuration.
- Staff roles are organizational roles, not separate customer organizations.
- Support multiple journalists per article with ordered bylines, public author profile pages, and clear lead-author ownership.
- An editor can manage all stories, but a journalist can edit only stories explicitly owned by or assigned to them before approval.
- All approved and published content points to an immutable approved revision; co-author changes after approval require re-review.

## 16. Additional acceptance criteria — multi-journalist newsroom

1. Two journalists can maintain distinct drafts without accessing each other's unpublished content through direct URLs or API requests.
2. A lead journalist can add another journalist as a co-author only where authorized; the public article displays bylines in configured order.
3. A journalist submitting an article cannot self-approve it even if they are assigned an editorial task; editor review is recorded with actor and timestamp.
4. An editor can request revisions with mandatory feedback; the journalist can resubmit a new revision without losing prior versions.
5. An editor can schedule an approved revision; repeated job execution never creates duplicate publication events.
6. A deactivated journalist's historical bylines remain visible while their CMS access is revoked.
7. Admin can invite journalists and editors and deactivate accounts; every role change is audited.
8. Public endpoints never return drafts, scheduled stories before due time, or unpublished revisions, including via search, sitemap, or related-article widgets.
