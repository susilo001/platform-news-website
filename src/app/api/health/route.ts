import { db } from "@/lib/db";
import { isDemo } from "@/lib/config";
export const dynamic = "force-dynamic";
export async function GET() {
  if (isDemo) return Response.json({ status: "demo" });
  try {
    await db.$queryRaw`SELECT 1`;
    const overdue = await db.publicationJob.count({
      where: { state: "PENDING", dueAt: { lt: new Date(Date.now() - 120000) } },
    });
    return Response.json(
      {
        status: overdue ? "degraded" : "ok",
        publishing: overdue ? "overdue" : "on-time",
      },
      { status: overdue ? 503 : 200 },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
