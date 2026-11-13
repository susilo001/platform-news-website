import { notFound } from "next/navigation";
import { getActor } from "@/modules/auth/session";
import { cmsArticle } from "@/modules/articles/cms-queries";
import { db } from "@/lib/db";
import { ArticleEditor } from "./article-editor";
import type { RichNode } from "@/modules/articles/content";
export async function EditorPage({ id }: { id?: string }) {
  const actor = await getActor();
  const [article, categories, media, staff] = await Promise.all([
    id ? cmsArticle(actor, id) : null,
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.media.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
  ]);
  if (id && !article) notFound();
  const r = article?.currentRevision;
  return (
    <ArticleEditor
      actor={actor}
      categories={categories}
      media={media}
      staff={staff}
      initial={{
        id: article?.id,
        version: article?.version ?? 0,
        status: article?.status ?? "DRAFT",
        title: r?.title ?? "",
        summary: r?.summary ?? "",
        slug: article?.slug ?? "",
        categoryId: article?.categoryId ?? categories[0]?.id ?? "",
        heroMediaId: r?.heroMediaId ?? "",
        tags: article?.tags.map((t) => t.tag.name).join(", ") ?? "",
        coauthorIds:
          article?.authors.filter((a) => !a.isLead).map((a) => a.userId) ?? [],
        seoTitle: r?.seoTitle ?? "",
        seoDescription: r?.seoDescription ?? "",
        bodyJson: (r?.bodyJson as RichNode) ?? {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
        featured: article?.featured ?? false,
        leadAuthorId: article?.leadAuthorId ?? actor.id,
        revisions:
          article?.revisions.map((r) => ({
            id: r.id,
            version: r.version,
            title: r.title,
            createdByName: r.author.name,
            createdAt: r.createdAt.toISOString(),
          })) ?? [],
        reviews:
          article?.reviews.map((r) => ({
            id: r.id,
            comment: r.comment,
            decision: r.decision,
            reviewerName: r.reviewer.name,
            createdAt: r.createdAt.toISOString(),
          })) ?? [],
      }}
    />
  );
}
