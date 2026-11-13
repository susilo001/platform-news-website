import Link from "next/link";
import type { Status } from "@/modules/workflow/policy";
export type TableArticle = {
  id: string;
  slug: string;
  status: Status;
  updatedAt: Date | string;
  currentRevision: { title: string } | null;
  category: { name: string };
  leadAuthor: { name: string };
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
export function CmsTable({
  articles,
  base = "/cms",
}: {
  articles: TableArticle[];
  base?: string;
}) {
  return (
    <div className="table-scroll">
      <table className="cms-table">
        <thead>
          <tr>
            <th>Story</th>
            <th>Status</th>
            <th>Author</th>
            <th>Last updated</th>
            <th aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td>
                <Link href={`${base}/articles/${a.id}/edit`}>
                  <strong>
                    {a.currentRevision?.title ?? "Untitled story"}
                  </strong>
                  <small>{a.category.name}</small>
                </Link>
              </td>
              <td>
                <StatusBadge status={a.status} />
              </td>
              <td>
                <span className="table-avatar">{a.leadAuthor.name[0]}</span>
                {a.leadAuthor.name}
              </td>
              <td>
                {new Date(a.updatedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </td>
              <td>
                <Link
                  href={`${base}/articles/${a.id}/edit`}
                  aria-label={`Open ${a.currentRevision?.title}`}
                >
                  ↗
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!articles.length && (
        <div className="empty-state">
          <h3>Your next story starts here.</h3>
          <p>Create an article or choose a different filter.</p>
        </div>
      )}
    </div>
  );
}
