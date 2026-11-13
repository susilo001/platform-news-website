import Link from "next/link";
import { getActor } from "@/modules/auth/session";
import { cmsArticles } from "@/modules/articles/cms-queries";
import { CmsTable } from "@/components/cms-table";
export default async function Articles({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const actor = await getActor();
  const raw = (await searchParams).status;
  const status = [
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "UNPUBLISHED",
  ].includes(raw ?? "")
    ? raw
    : undefined;
  const articles = await cmsArticles(actor, status);
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">THE STORY SO FAR</span>
          <h1>
            All articles<span className="brand-dot">.</span>
          </h1>
          <p>
            From the first idea to the final headline. Every story, in one
            place.
          </p>
        </div>
        <Link className="button" href="/cms/articles/new">
          + Write a story
        </Link>
      </div>
      <div className="filter-tabs">
        {[
          "ALL",
          "DRAFT",
          "IN_REVIEW",
          "APPROVED",
          "SCHEDULED",
          "PUBLISHED",
          "UNPUBLISHED",
        ].map((s) => (
          <Link
            className={(!status && s === "ALL") || status === s ? "active" : ""}
            key={s}
            href={`/cms/articles${s === "ALL" ? "" : `?status=${s}`}`}
          >
            {s.replaceAll("_", " ").toLowerCase()}
          </Link>
        ))}
      </div>
      <section className="panel">
        <CmsTable articles={articles} />
      </section>
      <p className="muted small">
        Showing up to 100 most recently updated articles.
      </p>
    </>
  );
}
