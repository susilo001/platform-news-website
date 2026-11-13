# PRD v1.1 implementation coverage

This is an initial full-stack implementation for review and configuration, not a declaration that the PRD's production definition of done has been met.

| Area                     | Implemented                                                                                                      | Remaining validation or scope                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Public site              | Homepage, category/author listings, article reading, related stories, search/pagination                          | Real editorial content and traffic/performance evaluation                      |
| SEO                      | Canonical article/category URLs, OG/Twitter, JSON-LD, sitemap, robots                                            | Verify canonical production domain and crawler behavior after deployment       |
| Responsive/accessibility | Responsive public/CMS layouts, labelled forms, keyboard focus, skip link, semantic content, alt text             | Mobile browser CI and formal WCAG audit                                        |
| Staff authentication     | Auth.js GitHub OAuth, pre-invited email allowlist, fresh active-user checks                                      | Provider credentials and live sign-in rehearsal                                |
| Authorization            | Central role/ownership policies; every mutation checks current actor                                             | Independent security review, role-change E2E                                   |
| Article CRUD             | Create/save/edit drafts, soft-delete with reason, title/summary/body/slug/category/tags/coauthors/SEO/hero image | Larger CMS list pagination and slug redirects are future improvements          |
| Rich text                | Tiptap headings, emphasis, links, lists, quotes, images; structured safe renderer                                | Editorial content and assistive-technology assessment                          |
| Review                   | Submission, approval, change requests with notes, no self-approval except audited admin override                 | Real-team review rehearsal                                                     |
| Scheduling               | UTC durable jobs, cancellation, atomic idempotent worker, publication outbox                                     | Production worker availability and overdue alert routing                       |
| Media                    | Reusable library, authenticated bounded upload, signature/type/pixel/alt checks, metadata stripping              | Real storage integration; server-mediated upload replaces direct signed upload |
| Taxonomy                 | Create/update categories, unique slugs, per-story tag creation/assignment                                        | Dedicated tag rename/delete UI is deferred                                     |
| Revisions/audit          | Immutable revision saves/restores, optimistic version checks, reviews, editorial/admin/media audit trail         | Operational retention/recovery policy                                          |
| Previews                 | Signed 15-minute article/revision links; access rechecked; no-store/noindex                                      | Configured secret and production URL rehearsal                                 |
| Staff management         | Admin grants access, updates roles, deactivates staff                                                            | Invitation emails and staff profile editing are deferred                       |
| Site settings            | Edition tagline and publisher timezone                                                                           | Brand remains The Current; dynamic name/logo management is deferred            |
| Caching/search           | PostgreSQL FTS index; shared public visibility queries                                                           | Public reads intentionally dynamic; shared caching deferred until measured     |
| Analytics                | Article/status counts in dashboard                                                                               | View tracking/analytics remain P1                                              |
| Operations               | Docker targets, local PostgreSQL/MinIO, migrations, CI, health, structured worker logs                           | Hosting, backups, alerting, tracing, production security/performance review    |
