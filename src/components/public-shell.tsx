import Link from "next/link";
import { ArrowUpRight, Search, Menu, ArrowRight } from "lucide-react";
import { getCategories } from "@/modules/articles/queries";
import { getSettings } from "@/lib/settings";
import { isDemo } from "@/lib/config";
export async function PublicHeader() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getSettings(),
  ]);
  const editionDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: settings.timezone,
  });
  return (
    <>
      <div className="edition-bar">
        <span>{settings.description}</span>
        <span>
          {editionDate}{" "}
          <span className="edition-label">
            {isDemo ? "DEMO EDITION" : "DIGITAL EDITION"}
          </span>
        </span>
      </div>
      <header className="masthead">
        <Link className="wordmark" href="/">
          the current<span className="brand-dot">.</span>
        </Link>
        <span className="masthead-note">
          The stories that matter.
          <br />
          The context you need.
        </span>
        <Link className="newsroom-link" href={isDemo ? "/demo" : "/cms"}>
          Inside the newsroom <ArrowUpRight size={15} />
        </Link>
      </header>
      <nav className="public-nav" aria-label="Main navigation">
        <div className="nav-scroll">
          <Link href="/" className="nav-home">
            The Latest
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <Link
          className="search-trigger"
          href="/search"
          aria-label="Search stories"
        >
          <Search size={18} />
          <span>Search</span>
        </Link>
      </nav>
    </>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <Link className="wordmark" href="/">
          the current<span className="brand-dot">.</span>
        </Link>
        <p>
          A wider perspective.
          <br />
          Independent by nature. Curious by design.
        </p>
      </div>
      <div>
        <span className="eyebrow">KEEP EXPLORING</span>
        <Link href="/category/world">World</Link>
        <Link href="/category/technology">Technology</Link>
        <Link href="/category/culture">Culture</Link>
      </div>
      <div>
        <span className="eyebrow">THE NEWSROOM</span>
        <Link href="/about">
          About The Current <ArrowUpRight size={13} />
        </Link>
        <Link href="/cms">
          Staff sign in <ArrowUpRight size={13} />
        </Link>
        {isDemo && (
          <Link href="/demo">
            Explore the CMS <ArrowRight size={13} />
          </Link>
        )}
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} The Current. All rights reserved.
        </span>
        <span>
          {isDemo
            ? "Demonstration · All stories are illustrative sample content."
            : "Thoughtful reporting. Meaningful perspective."}
        </span>
      </div>
    </footer>
  );
}
