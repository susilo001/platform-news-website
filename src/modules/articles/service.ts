import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { articleInput, parseBody, bodyText } from "./content";
import {
  canEdit,
  requireActive,
  assertTransition,
  type Actor,
  type Status,
} from "@/modules/workflow/policy";
export async function saveArticle(actor: Actor, raw: unknown) {
  requireActive(actor);
  const input = articleInput.parse(raw);
  const body = parseBody(input.bodyJson);
  return db.$transaction(
    async (tx) => {
      let article = input.id
        ? await tx.article.findUniqueOrThrow({
            where: { id: input.id, deletedAt: null },
          })
        : null;
      if (article && !canEdit(actor, article))
        throw new Error(
          "This article cannot be edited. Return it to draft first.",
        );
      if (article && article.version !== input.version)
        throw new Error("Another editor saved changes. Reload before saving.");
      if (!article)
        article = await tx.article.create({
          data: {
            slug: input.slug,
            leadAuthorId: actor.id,
            categoryId: input.categoryId,
          },
        });
      const revision = await tx.articleRevision.create({
        data: {
          articleId: article.id,
          version: article.version + 1,
          title: input.title,
          summary: input.summary,
          bodyJson: body as Prisma.InputJsonValue,
          bodyText: bodyText(body),
          heroMediaId: input.heroMediaId || null,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          createdBy: actor.id,
        },
      });
      await tx.article.update({
        where: { id: article.id, version: article.version },
        data: {
          slug: input.slug,
          categoryId: input.categoryId,
          ...(actor.role !== "JOURNALIST" ? { featured: input.featured } : {}),
          currentRevisionId: revision.id,
          approvedRevisionId: null,
          version: { increment: 1 },
        },
      });
      const authorIds = [
        ...new Set([article.leadAuthorId, ...input.coauthorIds]),
      ];
      const count = await tx.user.count({
        where: { id: { in: authorIds }, active: true },
      });
      if (count !== authorIds.length)
        throw new Error("All byline authors must be active staff.");
      await tx.articleAuthor.deleteMany({ where: { articleId: article.id } });
      await tx.articleAuthor.createMany({
        data: authorIds.map((userId, i) => ({
          articleId: article!.id,
          userId,
          bylineOrder: i,
          isLead: userId === article!.leadAuthorId,
        })),
      });
      await tx.articleTag.deleteMany({ where: { articleId: article.id } });
      for (const name of [
        ...new Set(
          input.tags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ]) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (!slug) continue;
        const tag = await tx.tag.upsert({
          where: { slug },
          create: { slug, name },
          update: {},
        });
        await tx.articleTag.create({
          data: { articleId: article.id, tagId: tag.id },
        });
      }
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "Article",
          entityId: article.id,
          action: "REVISION_SAVED",
          metadata: { revisionId: revision.id },
        },
      });
      return article.id;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export async function transitionArticle(
  actor: Actor,
  id: string,
  version: number,
  next: Status,
  reason: string,
  dueAt?: Date,
) {
  return db.$transaction(
    async (tx) => {
      const article = await tx.article.findUniqueOrThrow({
        where: { id, deletedAt: null },
        include: {
          currentRevision: { include: { heroMedia: true } },
          authors: true,
        },
      });
      if (article.version !== version)
        throw new Error("Article changed. Reload and try again.");
      assertTransition(
        actor,
        { ...article, authorIds: article.authors.map((a) => a.userId) },
        next,
        reason,
        dueAt,
      );
      const revision = article.currentRevision;
      if (!revision) throw new Error("Save an article revision first.");
      if (
        ["IN_REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED"].includes(next) &&
        (!revision.title ||
          !revision.summary ||
          revision.bodyText.length < 40 ||
          !revision.heroMedia?.altText)
      )
        throw new Error(
          "Add a complete story and a hero image with alt text before submission.",
        );
      if (
        ["PUBLISHED", "SCHEDULED"].includes(next) &&
        article.approvedRevisionId !== article.currentRevisionId
      )
        throw new Error("This revision needs editorial approval.");
      await tx.article.update({
        where: { id, version },
        data: {
          status: next,
          version: { increment: 1 },
          ...(next === "APPROVED" ? { approvedRevisionId: revision.id } : {}),
          ...(next === "DRAFT"
            ? { approvedRevisionId: null, scheduledAt: null }
            : {}),
          ...(next === "SCHEDULED" ? { scheduledAt: dueAt } : {}),
          ...(next === "PUBLISHED"
            ? {
                publishedRevisionId: revision.id,
                publishedAt: new Date(),
                scheduledAt: null,
              }
            : {}),
        },
      });
      if (next === "SCHEDULED")
        await tx.publicationJob.create({
          data: {
            articleId: id,
            revisionId: revision.id,
            dueAt: dueAt!,
            idempotencyKey: `${id}:${revision.id}:${article.version}`,
          },
        });
      if (next === "DRAFT")
        await tx.publicationJob.updateMany({
          where: { articleId: id, state: "PENDING" },
          data: { state: "CANCELLED" },
        });
      if (article.status === "IN_REVIEW")
        await tx.editorialReview.create({
          data: {
            articleId: id,
            revisionId: revision.id,
            reviewerId: actor.id,
            decision: next,
            comment: reason,
          },
        });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "Article",
          entityId: id,
          action: next,
          metadata: { from: article.status, reason, revisionId: revision.id },
        },
      });
      if (next === "PUBLISHED" || next === "UNPUBLISHED")
        await tx.outboxEvent.create({
          data: {
            aggregateId: id,
            eventType: next,
            payload: { slug: article.slug },
          },
        });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function archiveDraft(
  actor: Actor,
  id: string,
  version: number,
  reason: string,
) {
  requireActive(actor);
  if (!reason.trim() || reason.length > 2000)
    throw new Error("Add a reason before deleting this draft.");
  await db.$transaction(
    async (tx) => {
      const article = await tx.article.findUniqueOrThrow({
        where: { id, deletedAt: null },
      });
      if (!canEdit(actor, article))
        throw new Error(
          "Only an authorized author or editor can delete a draft.",
        );
      if (article.version !== version)
        throw new Error("Article changed. Reload and try again.");
      await tx.article.update({
        where: { id, version },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "Article",
          entityId: id,
          action: "DRAFT_DELETED",
          metadata: { reason },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
