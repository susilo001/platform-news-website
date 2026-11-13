import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsDashboard } from "@/components/cms-dashboard";
import { CmsTable } from "@/components/cms-table";
import { ArticleEditor } from "@/components/article-editor";
import { demoArticles, demoCounts } from "@/lib/demo-cms";
import { demoStories, categories } from "@/modules/articles/demo";
export default async function Demo({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { path = [] } = await params;
  const section = path[0];
  if (!section)
    return (
      <CmsDashboard
        name="Maya"
        articles={demoArticles}
        counts={demoCounts}
        base="/demo"
      />
    );
  if (section === "articles" && path.length > 1) {
    const story =
      path[1] === "new" ? undefined : demoStories.find((s) => s.id === path[1]);
    if (path[1] !== "new" && !story) notFound();
    return (
      <ArticleEditor
        demo
        actor={{ id: "maya", role: "ADMIN" }}
        categories={categories}
        staff={demoStories
          .flatMap((s) => s.authors)
          .filter((s, i, all) => all.findIndex((a) => a.id === s.id) === i)}
        media={demoStories.map((s) => ({
          id: s.id,
          url: s.image,
          altText: s.alt,
        }))}
        initial={{
          id: story?.id,
          version: story ? 1 : 0,
          status: "DRAFT",
          title: story?.title ?? "",
          summary: story?.summary ?? "",
          slug: story?.slug ?? "",
          bodyJson: story?.body ?? {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
          categoryId: story?.category.id ?? "world",
          heroMediaId: story?.id ?? "",
          seoTitle: "",
          seoDescription: "",
          leadAuthorId: "maya",
          coauthorIds: [],
          tags: story?.tags.join(", ") ?? "",
          revisions: story
            ? [
                {
                  id: "sample-v1",
                  version: 1,
                  title: story.title,
                  createdAt: story.updatedAt,
                },
              ]
            : [],
          reviews: [],
        }}
      />
    );
  }
  if (section === "articles" || section === "review") {
    const status =
      section === "review" ? "IN_REVIEW" : (await searchParams).status;
    return (
      <>
        <div className="cms-page-heading">
          <div>
            <span className="eyebrow accent">
              {section === "review"
                ? "A THOUGHTFUL SECOND LOOK"
                : "THE STORY SO FAR"}
            </span>
            <h1>
              {section === "review" ? "Review queue" : "All articles"}
              <span className="brand-dot">.</span>
            </h1>
            <p>
              {section === "review"
                ? "Thoughtful feedback makes every story stronger."
                : "From the first idea to the final headline. Every story, in one place."}
            </p>
          </div>
          <Link href="/demo/articles/new" className="button">
            + Write a story
          </Link>
        </div>
        {section !== "review" && (
          <div className="filter-tabs">
            {[
              "ALL",
              "DRAFT",
              "IN_REVIEW",
              "APPROVED",
              "SCHEDULED",
              "PUBLISHED",
            ].map((s) => (
              <Link
                key={s}
                className={
                  status === s || (!status && s === "ALL") ? "active" : ""
                }
                href={`/demo/articles${s === "ALL" ? "" : `?status=${s}`}`}
              >
                {s.replaceAll("_", " ").toLowerCase()}
              </Link>
            ))}
          </div>
        )}
        <section className="panel">
          <CmsTable
            base="/demo"
            articles={demoArticles.filter(
              (a) => !status || a.status === status,
            )}
          />
        </section>
      </>
    );
  }
  if (section === "media")
    return (
      <>
        <DemoHeading
          eyebrow="A STORY IN EVERY FRAME"
          title="Media library"
          description="The images that bring your stories to life."
        />
        <div className="notice">
          Sample images for illustration. Sign in to upload and manage your
          publication’s media.
        </div>
        <div className="media-grid">
          {demoStories.map((s) => (
            <article className="panel media-card" key={s.id}>
              <img src={s.image} alt={s.alt} />
              <div>
                <strong>{s.alt}</strong>
                <small>Sample image · Unsplash</small>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  if (section === "categories")
    return (
      <>
        <DemoHeading
          eyebrow="PUT EVERY STORY IN ITS PLACE"
          title="Categories & tags"
          description="A clear path to every reader’s next discovery."
        />
        <section className="panel">
          {categories.map((c) => (
            <div className="taxonomy-row" key={c.id}>
              <div>
                <strong>{c.name}</strong>
                <small>{c.description}</small>
              </div>
              <span>
                {demoStories.filter((s) => s.category.id === c.id).length}{" "}
                sample stories
              </span>
            </div>
          ))}
        </section>
      </>
    );
  if (section === "users") {
    const staff = demoStories
      .flatMap((s) => s.authors)
      .filter((s, i, all) => all.findIndex((a) => a.id === s.id) === i);
    return (
      <>
        <DemoHeading
          eyebrow="THE PEOPLE BEHIND THE STORIES"
          title="Team members"
          description="One publication. Many perspectives."
        />
        <section className="panel">
          {staff.map((u, i) => (
            <div className="taxonomy-row" key={u.id}>
              <div>
                <strong>{u.name}</strong>
                <small>{u.bio}</small>
              </div>
              <span className="role-label">
                {["Admin", "Editor", "Journalist"][i]}
              </span>
            </div>
          ))}
        </section>
      </>
    );
  }
  if (section === "audit")
    return (
      <>
        <DemoHeading
          eyebrow="ACCOUNTABILITY, BUILT IN"
          title="Activity log"
          description="Every editorial decision leaves a clear record."
        />
        <div className="notice">
          Illustrative activity below. Live audit events are recorded by the
          production workspace.
        </div>
        <section className="panel">
          {[
            "Maya saved a new article revision",
            "James submitted a story for review",
            "Amara published an approved article",
            "Maya scheduled a story for publication",
          ].map((a, i) => (
            <div key={a} className="taxonomy-row">
              <strong>{a}</strong>
              <small>Sample event {i + 1}</small>
            </div>
          ))}
        </section>
      </>
    );
  if (section === "settings")
    return (
      <>
        <DemoHeading
          eyebrow="MAKE IT YOUR PUBLICATION"
          title="Publication settings"
          description="One newsroom. One identity."
        />
        <div className="panel panel-body form-stack settings-form">
          <label>
            Publication name
            <input value="The Current" readOnly />
          </label>
          <label>
            Edition tagline
            <input
              value="Independent journalism. A wider perspective."
              readOnly
            />
          </label>
          <label>
            Timezone
            <input value="Asia/Jakarta" readOnly />
          </label>
          <button className="button" disabled>
            Save settings (demo)
          </button>
        </div>
      </>
    );
  notFound();
}
function DemoHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="cms-page-heading">
      <div>
        <span className="eyebrow accent">{eyebrow}</span>
        <h1>
          {title}
          <span className="brand-dot">.</span>
        </h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
