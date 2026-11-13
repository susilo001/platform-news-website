import { notFound } from "next/navigation";
import { getCategories, listStories } from "@/modules/articles/queries";
import { StoryCard } from "@/components/story-card";
import { Pagination } from "@/components/pagination";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const c = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: c?.name ?? "Category not found",
    description: c?.description,
    alternates: { canonical: `/category/${slug}` },
  };
}
export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const c = (await getCategories()).find((c) => c.slug === slug);
  if (!c) notFound();
  const { stories, total, page } = await listStories({
    category: slug,
    page: Number((await searchParams).page) || 1,
  });
  return (
    <main id="main">
      <header className="listing-header">
        <span className="eyebrow accent">A WIDER PERSPECTIVE</span>
        <h1>
          {c.name}
          <span className="brand-dot">.</span>
        </h1>
        <p>{c.description}</p>
      </header>
      {stories.length ? (
        <div className="story-grid listing-grid">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>More stories are on the way.</h2>
          <p>There are no published stories on this page.</p>
        </div>
      )}
      <Pagination page={page} total={total} base={`/category/${slug}`} />
    </main>
  );
}
