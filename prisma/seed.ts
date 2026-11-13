import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { categories, demoStories } from "../src/modules/articles/demo";
const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || email.endsWith("@example.com"))
    throw new Error(
      "Set ADMIN_EMAIL to your verified GitHub email before seeding.",
    );
  const admin = await db.user.upsert({
    where: { email },
    create: {
      email,
      name: "Publication Admin",
      role: "ADMIN",
      publicSlug: "publication-admin",
    },
    update: {},
  });
  for (const c of categories)
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: {},
    });
  console.info(
    `Admin and categories ready. No articles were published. Sign in using the verified GitHub email configured in ADMIN_EMAIL.`,
  );
  if (process.env.SEED_SAMPLE_DRAFTS === "true") {
    for (const s of demoStories.slice(0, 3)) {
      const existing = await db.article.findUnique({ where: { slug: s.slug } });
      if (existing) continue;
      await db.$transaction(async (tx) => {
        const article = await tx.article.create({
          data: {
            slug: s.slug,
            categoryId: s.category.id,
            leadAuthorId: admin.id,
          },
        });
        const revision = await tx.articleRevision.create({
          data: {
            articleId: article.id,
            version: 1,
            title: s.title,
            summary: s.summary,
            bodyJson: JSON.parse(JSON.stringify(s.body)),
            bodyText: s.summary,
            createdBy: admin.id,
          },
        });
        await tx.article.update({
          where: { id: article.id },
          data: { currentRevisionId: revision.id, version: 1 },
        });
        await tx.articleAuthor.create({
          data: { articleId: article.id, userId: admin.id, isLead: true },
        });
      });
    }
    console.info(
      "Optional sample drafts created. Add a licensed hero image before submitting.",
    );
  }
}
main().finally(() => db.$disconnect());
