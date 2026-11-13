import { Photo } from "./photo";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Story } from "@/modules/articles/demo";
export function StoryCard({
  story,
  compact = false,
}: {
  story: Story;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "story-card compact" : "story-card"}>
      <Link href={`/news/${story.slug}`} className="story-image">
        <Photo src={story.image} alt={story.alt} compact={compact} />
        <span className="image-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="story-copy">
        <Link
          href={`/category/${story.category.slug}`}
          className="eyebrow accent"
        >
          {story.category.name}
        </Link>
        <h3>
          <Link href={`/news/${story.slug}`}>{story.title}</Link>
        </h3>
        {!compact && <p>{story.summary}</p>}
        <div className="byline">
          {story.authors.map((x) => x.name).join(", ")}
          <span>·</span>
          {Math.max(3, Math.ceil(JSON.stringify(story.body).length / 1100))} min
          read
        </div>
      </div>
    </article>
  );
}
