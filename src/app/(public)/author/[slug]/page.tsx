import { notFound } from "next/navigation";
import { getAuthor, listStories } from "@/modules/articles/queries";
import { StoryCard } from "@/components/story-card";
import { Pagination } from "@/components/pagination";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return {
    title: (await getAuthor((await params).slug))?.name ?? "Author not found",
  };
}
export default async function Author({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();
  const result = await listStories({
    author: slug,
    page: Number((await searchParams).page) || 1,
  });
  return (
    <main id="main">
      <header className="listing-header">
        <span className="eyebrow accent">OUR JOURNALISTS</span>
        <h1>
          {author.name}
          <span className="brand-dot">.</span>
        </h1>
        <p>{author.bio}</p>
      </header>
      <div className="section-heading">
        <h2>Latest stories</h2>
      </div>
      <div className="story-grid listing-grid">
        {result.stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
      <Pagination {...result} base={`/author/${slug}`} />
    </main>
  );
}
