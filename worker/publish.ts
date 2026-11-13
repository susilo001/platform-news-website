import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publishDue, drainOutbox } from "../src/modules/publishing/process";
const db = new PrismaClient();
let running = true;
process.on("SIGTERM", () => {
  running = false;
});
process.on("SIGINT", () => {
  running = false;
});
async function main() {
  const poll = Math.min(
    60000,
    Math.max(1000, Number(process.env.WORKER_POLL_MS) || 30000),
  );
  let failures = 0;
  while (running) {
    try {
      const count = await publishDue(db);
      await drainOutbox(db);
      await db.rateLimit.deleteMany({
        where: { resetsAt: { lt: new Date() } },
      });
      if (count)
        console.info(JSON.stringify({ event: "worker.published", count }));
      failures = 0;
    } catch (error) {
      failures++;
      console.error(
        JSON.stringify({
          event: "worker.failed",
          failures,
          error: String(error),
        }),
      );
    }
    await new Promise((r) =>
      setTimeout(r, Math.min(60000, poll * Math.max(1, Math.min(failures, 4)))),
    );
  }
  await db.$disconnect();
}
main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
