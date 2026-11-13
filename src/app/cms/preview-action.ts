"use server";
import { getActor } from "@/modules/auth/session";
import { cmsArticle } from "@/modules/articles/cms-queries";
import { signPreview } from "@/lib/preview";
export async function createPreview(id: string) {
  const actor = await getActor();
  const article = await cmsArticle(actor, id);
  if (!article?.currentRevisionId) return { error: "Article not found." };
  try {
    const token = signPreview({
      articleId: id,
      revisionId: article.currentRevisionId,
      actorId: actor.id,
      expires: Date.now() + 15 * 60 * 1000,
    });
    return { url: `/preview?token=${encodeURIComponent(token)}` };
  } catch {
    return { error: "Preview signing is not configured." };
  }
}
