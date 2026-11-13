import { db } from "@/lib/db";
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  const entry = await db.rateLimit.upsert({
    where: { key: `${key}:${bucket}` },
    create: {
      key: `${key}:${bucket}`,
      count: 1,
      resetsAt: new Date((bucket + 1) * windowMs),
    },
    update: { count: { increment: 1 } },
  });
  if (entry.count > limit)
    throw new Error("Too many requests. Please try again later.");
}
