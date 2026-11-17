import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { drainOutbox } from "../src/modules/publishing/process";

// One-off housekeeping for the manual-publishing deployment. Never publishes jobs.
const db = new PrismaClient();
async function main() {
  let processed = 0;
  let count: number;
  do {
    count = await drainOutbox(db);
    processed += count;
  } while (count === 100);
  const expired = await db.rateLimit.deleteMany({
    where: { resetsAt: { lt: new Date() } },
  });
  console.info(
    JSON.stringify({
      event: "maintenance.completed",
      processed,
      expiredRateLimits: expired.count,
    }),
  );
}
main()
  .catch(() => {
    console.error("Maintenance failed. Check database access and retry.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
