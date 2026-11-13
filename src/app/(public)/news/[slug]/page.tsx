import { Photo } from "@/components/photo";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory, listStories } from "@/modules/articles/queries";
import { RichBody } from "@/components/rich-body";
import { StoryCard } from "@/components/story-card";
import { siteUrl, isDemo } from "@/lib/config";
import { ShareButton } from "@/components/share-button";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const story = await getStory((await params).slug);
  if (!story) return { title: "Story not found" };
  return {
    title: story.seoTitle || story.title,
    description: story.seoDescription || story.summary,
    alternates: { canonical: `/news/${story.slug}` },
    openGraph: {
      type: "article",
      title: story.title,
      description: story.summary,
      images: [story.image],
      publishedTime: story.publishedAt,
      modifiedTime: story.updatedAt,
    },
    twitter: { card: "summary_large_image" },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const story = await getStory((await params).slug);
  if (!story) notFound();
  const settings = await getSettings();
  const related = (await listStories({ category: story.category.slug })).stories
    .filter((s) => s.id !== story.id)
    .slice(0, 3);
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.summary,
    image: [story.image],
    datePublished: story.publishedAt,
    dateModified: story.updatedAt,
    author: story.authors.map((a) => ({
      "@type": "Person",
      name: a.name,
      url: `${siteUrl}/author/${a.slug}`,
    })),
    publisher: { "@type": "Organization", name: "The Current" },
    mainEntityOfPage: `${siteUrl}/news/${story.slug}`,
  };
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\u003c"),
        }}
      />
      <div className="article-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/category/${story.category.slug}`}>
          {story.category.name}
        </Link>
      </div>
      <header className="article-header">
        <span className="eyebrow accent">
          {story.category.name} / The big picture
        </span>
        <h1>{story.title}</h1>
        <p className="article-dek">{story.summary}</p>
        <div className="article-meta">
          <div>
            <div className="author-links">
              {story.authors.map((a) => (
                <Link key={a.id} href={`/author/${a.slug}`}>
                  {a.name}
                </Link>
              ))}
            </div>
            <time dateTime={story.publishedAt}>
              {new Date(story.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: settings.timezone,
              })}
            </time>
            {story.updatedAt !== story.publishedAt && (
              <small>
                {" "}
                · Updated{" "}
                {new Date(story.updatedAt).toLocaleDateString("en-GB", {
                  timeZone: settings.timezone,
                })}
              </small>
            )}
          </div>
          <ShareButton />
        </div>
      </header>
      <figure className="article-hero">
        <Photo src={story.image} alt={story.alt} hero />
        <figcaption>{story.alt}</figcaption>
      </figure>
      <div className="article-body">
        {isDemo && (
          <div className="notice">
            Demo story · Illustrative content, not reported news.
          </div>
        )}
        <RichBody body={story.body} />
        <div className="article-tags">
          {story.tags.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}>
              {t}
            </Link>
          ))}
        </div>
        <div className="author-box">
          <span className="eyebrow accent">ABOUT THE AUTHOR</span>
          {story.authors.map((a) => (
            <div key={a.id}>
              <h3>
                <Link href={`/author/${a.slug}`}>{a.name}</Link>
              </h3>
              <p>{a.bio}</p>
            </div>
          ))}
        </div>
      </div>
      {related.length > 0 && (
        <section className="latest-section">
          <div className="section-heading">
            <h2>
              Keep exploring<span className="brand-dot">.</span>
            </h2>
          </div>
          <div className="story-grid">
            {related.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
