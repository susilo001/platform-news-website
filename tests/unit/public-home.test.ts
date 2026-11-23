import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { demoStories } from "@/modules/articles/demo";
import Home from "@/app/(public)/page";

const { listStories } = vi.hoisted(() => ({ listStories: vi.fn() }));
vi.mock("@/modules/articles/queries", () => ({ listStories }));

beforeEach(() => listStories.mockReset());

it.each([0, 1, 2])(
  "shows each of %i published stories in The latest",
  async (count) => {
    const stories = demoStories.slice(0, count).map((story, index) => ({
      ...story,
      featured: index === count - 1,
    }));
    listStories.mockImplementation((options?: { category?: string }) => ({
      stories: options?.category ? [] : stories,
    }));

    const html = renderToStaticMarkup(await Home());
    const latest = html.match(
      /<section class="latest-section">([\s\S]*?)<\/section>/,
    )?.[1];

    if (!count) {
      expect(latest).toBeUndefined();
      expect(html).toContain("Our newsroom is preparing its first stories.");
      return;
    }

    expect(latest).toBeDefined();
    const cards = Array.from(
      latest!.matchAll(/<h3><a href="\/news\/([^"]+)"/g),
      (match) => match[1],
    );
    expect(cards).toEqual(stories.map((story) => story.slug));
  },
);
