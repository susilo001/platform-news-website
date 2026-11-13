import { getActor } from "@/modules/auth/session";
import { requireEditor } from "@/modules/workflow/policy";
import { cmsArticles } from "@/modules/articles/cms-queries";
import { CmsTable } from "@/components/cms-table";
export default async function Review() {
  const actor = await getActor();
  requireEditor(actor);
  const articles = await cmsArticles(actor, "IN_REVIEW");
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">A THOUGHTFUL SECOND LOOK</span>
          <h1>
            Review queue<span className="brand-dot">.</span>
          </h1>
          <p>
            Check the details, sharpen the story, and help great journalism
            reach its readers.
          </p>
        </div>
      </div>
      <section className="panel">
        <CmsTable articles={articles} />
      </section>
    </>
  );
}
