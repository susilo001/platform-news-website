import "server-only";
import { db } from "@/lib/db";
import type { Actor } from "@/modules/workflow/policy";
import type { Prisma } from "@prisma/client";
export function staffWhere(actor: Actor): Prisma.ArticleWhereInput {
  return actor.role === "JOURNALIST"
    ? { leadAuthorId: actor.id, deletedAt: null }
    : { deletedAt: null };
}
export async function cmsArticles(actor: Actor, status?: string) {
  return db.article.findMany({
    where: {
      ...staffWhere(actor),
      ...(status ? { status: status as never } : {}),
    },
    include: { currentRevision: true, category: true, leadAuthor: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
export async function cmsArticle(actor: Actor, id: string) {
  return db.article.findFirst({
    where: { id, ...staffWhere(actor) },
    include: {
      currentRevision: true,
      category: true,
      leadAuthor: true,
      revisions: {
        orderBy: { version: "desc" },
        take: 50,
        include: { author: { select: { name: true } } },
      },
      reviews: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
      tags: { include: { tag: true } },
      authors: true,
    },
  });
}
