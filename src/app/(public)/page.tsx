import { Photo } from "@/components/photo";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe2 } from "lucide-react";
import { listStories } from "@/modules/articles/queries";
import { StoryCard } from "@/components/story-card";
import { isDemo } from "@/lib/config";
export default async function Home() {
  const [{ stories }, { stories: culture }] = await Promise.all([
    listStories(),
    listStories({ category: "culture" }),
  ]);
  const hero = stories.find((s) => s.featured) ?? stories[0];
  const rest = stories.filter((s) => s.id !== hero?.id);
  return (
    <main id="main">
      <div className="section-kicker">
        <div>
          <span className="live-dot" /> THE DAILY BRIEF
        </div>
        <span>
          A fresh perspective on what’s happening now <ArrowDown />
        </span>
      </div>
      {!hero ? (
        <div className="empty-state">
          <h1>A new perspective is on its way.</h1>
          <p>Our newsroom is preparing its first stories. Check back soon.</p>
          <Link className="button" href="/cms">
            Open the newsroom
          </Link>
        </div>
      ) : (
        <>
          <section className="lead-grid" aria-label="Top stories">
            <article className="hero-story">
              <Link className="hero-image" href={`/news/${hero.slug}`}>
                <Photo src={hero.image} alt={hero.alt} hero />
                <span className="hero-image-label">
                  <span /> THE BIG PICTURE
                </span>
                <span className="hero-arrow">
                  <ArrowUpRight size={28} />
                </span>
              </Link>
              <div className="hero-copy">
                <span className="eyebrow accent">
                  {hero.category.name} <span className="quiet">/</span> In focus
                </span>
                <h1>
                  <Link href={`/news/${hero.slug}`}>{hero.title}</Link>
                </h1>
                <p>{hero.summary}</p>
                <div className="byline">
                  <span className="avatar-letter">
                    {hero.authors[0]?.name[0]}
                  </span>
                  {hero.authors[0]?.name}
                  <span>·</span>6 min read
                </div>
              </div>
            </article>
            <aside className="lead-aside">
              <div className="aside-heading">
                On our radar <span>01 — 03</span>
              </div>
              {rest.slice(0, 3).map((s) => (
                <StoryCard key={s.id} story={s} compact />
              ))}
            </aside>
          </section>
          <section className="latest-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow accent">STAY IN THE KNOW</span>
                <h2>
                  The latest<span className="brand-dot">.</span>
                </h2>
              </div>
              <Link href="/search">
                All stories <ArrowRight size={17} />
              </Link>
            </div>
            <div className="story-grid">
              {rest.slice(3, 6).map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
          <section className="perspective-banner">
            <div className="banner-orbit">
              <Globe2 size={72} strokeWidth={0.8} />
            </div>
            <div>
              <span className="eyebrow">BEYOND THE HEADLINES</span>
              <h2>
                Make sense of a world
                <br />
                that never stands still.
              </h2>
              <p>Independent voices. Deeper context. A wider perspective.</p>
            </div>
            <Link href="/about" className="button light">
              Meet The Current <ArrowUpRight size={17} />
            </Link>
          </section>
          <section className="editors-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow accent">WORTH YOUR TIME</span>
                <h2>
                  Culture & ideas<span className="brand-dot">.</span>
                </h2>
              </div>
              <Link href="/category/culture">
                Explore culture <ArrowRight size={17} />
              </Link>
            </div>
            <div className="story-grid">
              {culture.slice(0, 3).map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        </>
      )}
      {isDemo && (
        <p className="sample-note">
          You’re exploring a demo edition. Stories, bylines, and publication
          dates are illustrative.
        </p>
      )}
    </main>
  );
}
function ArrowDown() {
  return <span aria-hidden="true">↓</span>;
}
