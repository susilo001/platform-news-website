import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isDemo, pageSize } from "@/lib/config";
import { demoStories, categories as demoCategories, type Story } from "./demo";
const include = {
  category: true,
  authors: {
    include: { user: true },
    orderBy: { bylineOrder: "asc" as const },
  },
  publishedRevision: { include: { heroMedia: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;
type RecordArticle = Prisma.ArticleGetPayload<{ include: typeof include }>;
function toStory(a: RecordArticle): Story {
  const r = a.publishedRevision!;
  return {
    id: a.id,
    slug: a.slug,
    title: r.title,
    summary: r.summary,
    category: a.category,
    authors: a.authors.map((x) => ({
      id: x.user.id,
      name: x.user.name,
      slug: x.user.publicSlug,
      bio: x.user.bio,
    })),
    image: r.heroMedia?.url ?? "",
    alt: r.heroMedia?.altText ?? "",
    publishedAt: a.publishedAt!.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    body: r.bodyJson as Story["body"],
    tags: a.tags.map((x) => x.tag.name),
    featured: a.featured,
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
  };
}
export function publicWhere(): Prisma.ArticleWhereInput {
  return {
    deletedAt: null,
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    publishedRevisionId: { not: null },
  };
}
export async function getCategories() {
  return isDemo
    ? demoCategories
    : db.category.findMany({ orderBy: { name: "asc" } });
}
export async function listStories(
  opts: {
    category?: string;
    query?: string;
    author?: string;
    page?: number;
  } = {},
) {
  const page = Math.max(1, Math.min(10000, Math.floor(opts.page || 1)));
  const query = opts.query?.trim().slice(0, 200);
  if (isDemo) {
    const all = demoStories.filter(
      (a) =>
        (!opts.category || a.category.slug === opts.category) &&
        (!opts.author || a.authors.some((x) => x.slug === opts.author)) &&
        (!query ||
          `${a.title} ${a.summary} ${JSON.stringify(a.body)}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    );
    return {
      stories: all.slice((page - 1) * pageSize, page * pageSize),
      total: all.length,
      page,
    };
  }
  if (query) {
    const predicate = Prisma.sql`a."deletedAt" IS NULL AND a.status='PUBLISHED' AND a."publishedAt" <= NOW()
      AND to_tsvector('english',r.title || ' ' || r.summary || ' ' || r."bodyText") @@ websearch_to_tsquery('english',${query})
      ${opts.category ? Prisma.sql`AND EXISTS (SELECT 1 FROM "Category" c WHERE c.id=a."categoryId" AND c.slug=${opts.category})` : Prisma.empty}
      ${opts.author ? Prisma.sql`AND EXISTS (SELECT 1 FROM "ArticleAuthor" aa JOIN "User" u ON u.id=aa."userId" WHERE aa."articleId"=a.id AND u."publicSlug"=${opts.author})` : Prisma.empty}`;
    const [matches, counts] = await Promise.all([
      db.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT a.id FROM "Article" a JOIN "ArticleRevision" r ON r.id=a."publishedRevisionId" WHERE ${predicate} ORDER BY a."publishedAt" DESC,a.id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      ),
      db.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`SELECT COUNT(*) AS total FROM "Article" a JOIN "ArticleRevision" r ON r.id=a."publishedRevisionId" WHERE ${predicate}`,
      ),
    ]);
    const rows = await db.article.findMany({
      where: { ...publicWhere(), id: { in: matches.map((m) => m.id) } },
      include,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    });
    return { stories: rows.map(toStory), total: Number(counts[0].total), page };
  }
  const where: Prisma.ArticleWhereInput = {
    ...publicWhere(),
    ...(opts.category ? { category: { slug: opts.category } } : {}),
    ...(opts.author
      ? { authors: { some: { user: { publicSlug: opts.author } } } }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.article.findMany({
      where,
      include,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.article.count({ where }),
  ]);
  return { stories: rows.map(toStory), total, page };
}
export async function getStory(slug: string) {
  if (isDemo) return demoStories.find((x) => x.slug === slug);
  const a = await db.article.findFirst({
    where: { ...publicWhere(), slug },
    include,
  });
  return a ? toStory(a) : undefined;
}
export async function getAuthor(slug: string) {
  if (isDemo)
    return demoStories.flatMap((s) => s.authors).find((a) => a.slug === slug);
  const user = await db.user.findUnique({
    where: { publicSlug: slug },
    select: { id: true, name: true, publicSlug: true, bio: true },
  });
  return user ? { ...user, slug: user.publicSlug } : undefined;
}
export async function allPublicSlugs() {
  return isDemo
    ? demoStories.map((s) => ({
        slug: s.slug,
        updatedAt: new Date(s.updatedAt),
      }))
    : db.article.findMany({
        where: publicWhere(),
        select: { slug: true, updatedAt: true },
      });
}
