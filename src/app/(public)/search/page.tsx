import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { isDemo } from "@/lib/config";
import { listStories } from "@/modules/articles/queries";
import { StoryCard } from "@/components/story-card";
import { Pagination } from "@/components/pagination";
import { Search } from "lucide-react";
export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const p = await searchParams;
  const q = typeof p.q === "string" ? p.q.slice(0, 200) : "";
  if (q && !isDemo) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "shared";
    try {
      await rateLimit(
        `search:${createHash("sha256").update(ip).digest("hex").slice(0, 20)}`,
        60,
        60000,
      );
    } catch {
      return (
        <main id="main" className="empty-state">
          <h1>Please slow down.</h1>
          <p>Too many searches. Try again in a minute.</p>
        </main>
      );
    }
  }
  const result = await listStories({ query: q, page: Number(p.page) || 1 });
  return (
    <main id="main">
      <header className="listing-header">
        <span className="eyebrow accent">FOLLOW YOUR CURIOSITY</span>
        <h1>
          Find your next read<span className="brand-dot">.</span>
        </h1>
        <form action="/search" className="search-form">
          <Search size={22} />
          <input
            name="q"
            type="search"
            aria-label="Search stories"
            defaultValue={q}
            placeholder="Search stories, ideas, and perspectives…"
            maxLength={200}
          />
          <button className="button">
            Search <span>→</span>
          </button>
        </form>
        <p>
          {q
            ? `${result.total} ${result.total === 1 ? "story" : "stories"} for “${q}”`
            : "Explore all our latest stories."}
        </p>
      </header>
      {result.stories.length ? (
        <div className="story-grid listing-grid">
          {result.stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No stories found.</h2>
          <p>Try a different word or a broader topic.</p>
        </div>
      )}
      <Pagination {...result} base="/search" query={q} />
    </main>
  );
}
