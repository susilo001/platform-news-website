import { getActor } from "@/modules/auth/session";
import { requireEditor } from "@/modules/workflow/policy";
import { db } from "@/lib/db";
export default async function Audit() {
  requireEditor(await getActor());
  const events = await db.auditEvent.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">ACCOUNTABILITY, BUILT IN</span>
          <h1>
            Activity log<span className="brand-dot">.</span>
          </h1>
          <p>
            A clear record of editorial decisions and changes across your
            publication.
          </p>
        </div>
      </div>
      <section className="panel table-scroll">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Recorded (UTC)</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.action.replaceAll("_", " ")}</strong>
                </td>
                <td>{e.actor?.name ?? "Publishing worker"}</td>
                <td>
                  {e.entityType}
                  <small>{e.entityId}</small>
                </td>
                <td>
                  {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                </td>
                <td>
                  <details>
                    <summary>View</summary>
                    <pre>{JSON.stringify(e.metadata, null, 2)}</pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length && (
          <div className="empty-state">
            Your team’s activity will appear here.
          </div>
        )}
      </section>
      <p className="muted small">
        Most recent 100 events. Audit records cannot be edited in the CMS.
      </p>
    </>
  );
}
