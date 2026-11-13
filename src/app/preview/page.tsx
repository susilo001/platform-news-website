import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { verifyPreview } from "@/lib/preview";
import { db } from "@/lib/db";
import { RichBody } from "@/components/rich-body";
import type { RichNode } from "@/modules/articles/content";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private editorial preview",
  robots: { index: false, follow: false, noarchive: true },
};
export default async function Preview({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  noStore();
  const p = verifyPreview((await searchParams).token ?? "");
  if (!p) notFound();
  const [revision, actor] = await Promise.all([
    db.articleRevision.findFirst({
      where: { id: p.revisionId, articleId: p.articleId },
      include: { heroMedia: true, article: true },
    }),
    db.user.findUnique({ where: { id: p.actorId } }),
  ]);
  if (
    !revision ||
    revision.article.deletedAt ||
    !actor?.active ||
    (actor.role === "JOURNALIST" && revision.article.leadAuthorId !== actor.id)
  )
    notFound();
  return (
    <main id="main" className="preview-page">
      <div className="notice">
        Private preview · Expires after 15 minutes · Revision {revision.version}
      </div>
      <header className="article-header">
        <h1>{revision.title}</h1>
        <p className="article-dek">{revision.summary}</p>
      </header>
      {revision.heroMedia && (
        <figure className="article-hero">
          <img src={revision.heroMedia.url} alt={revision.heroMedia.altText} />
        </figure>
      )}
      <div className="article-body">
        <RichBody body={revision.bodyJson as RichNode} />
      </div>
    </main>
  );
}
