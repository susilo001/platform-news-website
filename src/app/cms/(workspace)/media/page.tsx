import { getActor } from "@/modules/auth/session";
import { db } from "@/lib/db";
import { MediaUpload } from "@/components/media-upload";
export default async function MediaPage() {
  await getActor();
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">A STORY IN EVERY FRAME</span>
          <h1>
            Media library<span className="brand-dot">.</span>
          </h1>
          <p>
            Upload, discover, and reuse the images that bring your stories to
            life.
          </p>
        </div>
      </div>
      <section className="panel panel-body">
        <MediaUpload />
      </section>
      <div className="media-grid">
        {media.map((m) => (
          <article className="panel media-card" key={m.id}>
            <img src={m.url} alt={m.altText} />
            <div>
              <strong>{m.altText}</strong>
              <small>
                {m.width} × {m.height} · {Math.round(m.sizeBytes / 1024)} KB
              </small>
            </div>
          </article>
        ))}
      </div>
      {!media.length && (
        <div className="empty-state">
          <h2>Your visual library starts here.</h2>
          <p>
            Upload your first image, with alt text that describes it clearly.
          </p>
        </div>
      )}
    </>
  );
}
