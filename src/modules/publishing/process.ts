import { Prisma, type PrismaClient } from "@prisma/client";
export async function publishDue(db: PrismaClient, now = new Date()) {
  return db.$transaction(async (tx) => {
    const jobs = await tx.$queryRaw<
      { id: string; articleId: string; revisionId: string }[]
    >(
      Prisma.sql`SELECT id,"articleId","revisionId" FROM "PublicationJob" WHERE state='PENDING' AND "dueAt"<=${now} ORDER BY "dueAt" FOR UPDATE SKIP LOCKED LIMIT 20`,
    );
    let published = 0;
    for (const job of jobs) {
      const result = await tx.article.updateMany({
        where: {
          id: job.articleId,
          status: "SCHEDULED",
          deletedAt: null,
          currentRevisionId: job.revisionId,
          approvedRevisionId: job.revisionId,
          scheduledAt: { lte: now },
        },
        data: {
          status: "PUBLISHED",
          publishedRevisionId: job.revisionId,
          publishedAt: now,
          scheduledAt: null,
          version: { increment: 1 },
        },
      });
      await tx.publicationJob.update({
        where: { id: job.id },
        data: {
          state: result.count ? "DONE" : "CANCELLED",
          attempts: { increment: 1 },
        },
      });
      if (result.count) {
        await tx.auditEvent.create({
          data: {
            entityType: "Article",
            entityId: job.articleId,
            action: "SCHEDULED_PUBLISHED",
            metadata: { jobId: job.id, revisionId: job.revisionId },
          },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateId: job.articleId,
            eventType: "PUBLISHED",
            payload: { jobId: job.id },
          },
        });
        published++;
      }
    }
    return published;
  });
}
// Public queries/search/sitemap read the same committed published revision without shared caching.
// This outbox is a durable integration seam; future cache/index consumers must be idempotent.
export async function drainOutbox(db: PrismaClient) {
  return db.$transaction(async (tx) => {
    const events = await tx.$queryRaw<
      { id: string; aggregateId: string; eventType: string }[]
    >`SELECT id,"aggregateId","eventType" FROM "OutboxEvent" WHERE "processedAt" IS NULL ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 100`;
    for (const e of events) {
      console.info(JSON.stringify({ event: "publication.committed", ...e }));
      await tx.outboxEvent.update({
        where: { id: e.id },
        data: { processedAt: new Date(), attempts: { increment: 1 } },
      });
    }
    return events.length;
  });
}
