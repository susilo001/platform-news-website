import { getActor } from "@/modules/auth/session";
import { db } from "@/lib/db";
import { cmsArticles, staffWhere } from "@/modules/articles/cms-queries";
import { CmsDashboard } from "@/components/cms-dashboard";
export default async function Dashboard() {
  const actor = await getActor();
  const [articles, groups] = await Promise.all([
    cmsArticles(actor),
    db.article.groupBy({
      by: ["status"],
      where: staffWhere(actor),
      _count: true,
    }),
  ]);
  const counts: Record<string, number> = {
    total: groups.reduce((n, g) => n + g._count, 0),
  };
  for (const g of groups) counts[g.status] = g._count;
  return <CmsDashboard name={actor.name} articles={articles} counts={counts} />;
}
