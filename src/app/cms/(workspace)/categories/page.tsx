import { MutationForm } from "@/components/mutation-form";
import { getActor } from "@/modules/auth/session";
import { requireEditor } from "@/modules/workflow/policy";
import { db } from "@/lib/db";
import { saveCategory } from "@/app/cms/actions";
export default async function Categories() {
  requireEditor(await getActor());
  const [categories, tags] = await Promise.all([
    db.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({ orderBy: { name: "asc" }, take: 200 }),
  ]);
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">PUT EVERY STORY IN ITS PLACE</span>
          <h1>
            Categories & tags<span className="brand-dot">.</span>
          </h1>
          <p>Help readers find their way to the stories they care about.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Categories</h2>
          </div>
          {categories.map((c) => (
            <div className="taxonomy-row" key={c.id}>
              <div>
                <strong>{c.name}</strong>
                <small>/{c.slug}</small>
              </div>
              <span>{c._count.articles} stories</span>
            </div>
          ))}
        </section>
        <MutationForm
          action={saveCategory}
          className="panel panel-body form-stack"
        >
          <h2>Add or update a category</h2>
          <label>
            Name
            <input name="name" required minLength={2} maxLength={60} />
          </label>
          <label>
            Slug
            <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </label>
          <label>
            Description
            <textarea name="description" maxLength={300} />
          </label>
          <small>
            An existing slug updates that category’s name and description.
          </small>
          <button className="button">Save category</button>
        </MutationForm>
      </div>
      <section className="panel panel-body">
        <h2>Tags</h2>
        <p className="muted">
          Tags are created and assigned in the article editor.
        </p>
        <div className="article-tags">
          {tags.map((t) => (
            <span key={t.id}>{t.name}</span>
          ))}
        </div>
      </section>
    </>
  );
}
