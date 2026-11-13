import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { Actor } from "@/modules/workflow/policy";
const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("PostgreSQL publication boundaries", () => {
  let db: PrismaClient;
  let save: typeof import("@/modules/articles/service").saveArticle;
  let transition: typeof import("@/modules/articles/service").transitionArticle;
  let queries: typeof import("@/modules/articles/queries");
  let publishing: typeof import("@/modules/publishing/process");
  const prefix = `it-${randomUUID()}`;
  let categoryId: string;
  let mediaId: string;
  let author: Actor, editor: Actor, admin: Actor;
  const ids: string[] = [];
  beforeAll(async () => {
    if (!new URL(testUrl!).pathname.endsWith("_test"))
      throw new Error(
        "Integration tests require a separate database whose name ends in _test.",
      );
    process.env.DATABASE_URL = testUrl;
    process.env.DEMO_MODE = "false";
    ({ db } = await import("@/lib/db"));
    ({ saveArticle: save, transitionArticle: transition } =
      await import("@/modules/articles/service"));
    queries = await import("@/modules/articles/queries");
    publishing = await import("@/modules/publishing/process");
    const people = await Promise.all(
      ["JOURNALIST", "EDITOR", "ADMIN"].map((role, i) =>
        db.user.create({
          data: {
            email: `${prefix}-${i}@example.test`,
            name: `Test ${role}`,
            publicSlug: `${prefix}-${i}`,
            role: role as Actor["role"],
          },
        }),
      ),
    );
    [author, editor, admin] = people;
    const category = await db.category.create({
      data: { name: "Integration", slug: prefix },
    });
    categoryId = category.id;
    const media = await db.media.create({
      data: {
        storageKey: prefix,
        url: "https://example.test/photo.webp",
        mimeType: "image/webp",
        sizeBytes: 100,
        width: 1200,
        height: 800,
        altText: "Integration test landscape",
        uploadedBy: author.id,
      },
    });
    mediaId = media.id;
  });
  function input(index: number) {
    return {
      version: 0,
      title: `Boundary verification ${prefix} ${index}`,
      summary:
        "A complete summary for testing editorial publication boundaries.",
      slug: `${prefix}-${index}`,
      categoryId,
      heroMediaId: mediaId,
      tags: "Tests",
      coauthorIds: [],
      bodyJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A complete body with enough useful text to pass the publication content validation for this test.",
              },
            ],
          },
        ],
      },
    };
  }
  async function draft(index: number) {
    const id = await save(author, input(index));
    ids.push(id);
    return id;
  }
  async function move(
    id: string,
    next: Parameters<typeof transition>[3],
    actor = editor,
    reason = "",
    dueAt?: Date,
  ) {
    const a = await db.article.findUniqueOrThrow({ where: { id } });
    return transition(actor, id, a.version, next, reason, dueAt);
  }
  it("hides draft/review/approved articles from URL, listing, search, and sitemap queries", async () => {
    const id = await draft(1);
    for (const status of ["DRAFT", "IN_REVIEW", "APPROVED"]) {
      if (status !== "DRAFT")
        await move(
          id,
          status as "IN_REVIEW" | "APPROVED",
          status === "IN_REVIEW" ? author : editor,
        );
      expect(await queries.getStory(`${prefix}-1`)).toBeUndefined();
      expect(
        (await queries.listStories({ category: prefix })).stories.some(
          (s) => s.id === id,
        ),
      ).toBe(false);
      expect(
        (await queries.listStories({ query: prefix })).stories.some(
          (s) => s.id === id,
        ),
      ).toBe(false);
      expect(
        (await queries.allPublicSlugs()).some((s) => s.slug === `${prefix}-1`),
      ).toBe(false);
    }
    await move(id, "PUBLISHED");
    expect((await queries.getStory(`${prefix}-1`))?.id).toBe(id);
    expect(
      (await queries.listStories({ query: prefix })).stories.some(
        (s) => s.id === id,
      ),
    ).toBe(true);
    await move(id, "UNPUBLISHED", editor, "Correction required");
    expect(await queries.getStory(`${prefix}-1`)).toBeUndefined();
    expect(
      (await queries.listStories({ query: prefix })).stories.some(
        (s) => s.id === id,
      ),
    ).toBe(false);
  });
  it("rejects journalist publication and editor self-approval", async () => {
    const id = await draft(2);
    await expect(move(id, "PUBLISHED", author)).rejects.toThrow();
    await move(id, "IN_REVIEW", author);
    await expect(
      move(id, "APPROVED", { ...author, role: "EDITOR" }),
    ).rejects.toThrow(/different editor/);
  });
  it("publishes an approved immutable revision and blocks silent edits", async () => {
    const id = await draft(3);
    await move(id, "IN_REVIEW", author);
    await move(id, "APPROVED");
    await move(id, "PUBLISHED");
    const a = await db.article.findUniqueOrThrow({ where: { id } });
    expect(a.publishedRevisionId).toBe(a.approvedRevisionId);
    await expect(
      save(editor, {
        ...input(3),
        id,
        version: a.version,
        title: "Unapproved changed headline",
      }),
    ).rejects.toThrow(/cannot be edited/);
    expect((await queries.getStory(`${prefix}-3`))?.title).toContain(
      "Boundary verification",
    );
  });
  it("publishes a due schedule once when workers race or retry", async () => {
    const id = await draft(4);
    await move(id, "IN_REVIEW", author);
    await move(id, "APPROVED");
    const due = new Date(Date.now() + 60000);
    await move(id, "SCHEDULED", editor, "", due);
    const later = new Date(due.getTime() + 1);
    await Promise.all([
      publishing.publishDue(db, later),
      publishing.publishDue(db, later),
    ]);
    await publishing.publishDue(db, later);
    expect((await db.article.findUniqueOrThrow({ where: { id } })).status).toBe(
      "PUBLISHED",
    );
    expect(
      await db.auditEvent.count({
        where: { entityId: id, action: "SCHEDULED_PUBLISHED" },
      }),
    ).toBe(1);
    expect(
      await db.outboxEvent.count({
        where: { aggregateId: id, eventType: "PUBLISHED" },
      }),
    ).toBe(1);
  });
  it("cancels scheduled work when returning to draft", async () => {
    const id = await draft(5);
    await move(id, "IN_REVIEW", author);
    await move(id, "APPROVED");
    const due = new Date(Date.now() + 60000);
    await move(id, "SCHEDULED", editor, "", due);
    await move(id, "DRAFT");
    await publishing.publishDue(db, new Date(due.getTime() + 1));
    expect((await db.article.findUniqueOrThrow({ where: { id } })).status).toBe(
      "DRAFT",
    );
  });
  it("detects stale saves and protects ownership", async () => {
    const id = await draft(6);
    await expect(
      save({ ...author, id: editor.id }, { ...input(6), id, version: 1 }),
    ).rejects.toThrow(/cannot be edited/);
    await save(author, {
      ...input(6),
      id,
      version: 1,
      title: "A valid second revision headline",
    });
    await expect(save(author, { ...input(6), id, version: 1 })).rejects.toThrow(
      /Another editor/,
    );
    expect(await db.articleRevision.count({ where: { articleId: id } })).toBe(
      2,
    );
  });
  it("requires hero metadata before review", async () => {
    const id = await save(author, { ...input(7), heroMediaId: "" });
    ids.push(id);
    await expect(move(id, "IN_REVIEW", author)).rejects.toThrow(/hero image/);
  });
  it("soft-deletes only authorized drafts and retains revision/audit history", async () => {
    const id = await draft(8);
    const { archiveDraft } = await import("@/modules/articles/service");
    await expect(
      archiveDraft({ ...author, id: editor.id }, id, 1, "Duplicate story"),
    ).rejects.toThrow();
    await archiveDraft(author, id, 1, "Duplicate story");
    expect(
      (await db.article.findUniqueOrThrow({ where: { id } })).deletedAt,
    ).not.toBeNull();
    await expect(
      save(author, { ...input(8), id, version: 2 }),
    ).rejects.toThrow();
    expect(await db.articleRevision.count({ where: { articleId: id } })).toBe(
      1,
    );
    expect(
      await db.auditEvent.count({
        where: { entityId: id, action: "DRAFT_DELETED" },
      }),
    ).toBe(1);
  });
  afterAll(async () => {
    if (!db) return;
    await db.article.updateMany({
      where: { id: { in: ids } },
      data: {
        currentRevisionId: null,
        approvedRevisionId: null,
        publishedRevisionId: null,
      },
    });
    await db.editorialReview.deleteMany({ where: { articleId: { in: ids } } });
    await db.publicationJob.deleteMany({ where: { articleId: { in: ids } } });
    await db.articleAuthor.deleteMany({ where: { articleId: { in: ids } } });
    await db.articleTag.deleteMany({ where: { articleId: { in: ids } } });
    await db.articleRevision.deleteMany({ where: { articleId: { in: ids } } });
    await db.article.deleteMany({ where: { id: { in: ids } } });
    await db.auditEvent.deleteMany({
      where: {
        OR: [
          { entityId: { in: ids } },
          {
            actorId: {
              in: [author?.id, editor?.id, admin?.id].filter(Boolean),
            },
          },
        ],
      },
    });
    await db.outboxEvent.deleteMany({ where: { aggregateId: { in: ids } } });
    if (mediaId) await db.media.delete({ where: { id: mediaId } });
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await db.$disconnect();
  });
});
