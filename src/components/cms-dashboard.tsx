import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  CheckCheck,
  Clock3,
  Globe2,
  PenLine,
} from "lucide-react";
import { CmsTable, type TableArticle } from "./cms-table";
export function CmsDashboard({
  name,
  articles,
  counts,
  base = "/cms",
}: {
  name: string;
  articles: TableArticle[];
  counts: Record<string, number>;
  base?: string;
}) {
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">YOUR NEWSROOM, AT A GLANCE</span>
          <h1>
            A new day. New perspectives<span className="brand-dot">.</span>
          </h1>
          <p>
            Welcome back, {name.split(" ")[0]}. Here’s what’s happening in your
            newsroom.
          </p>
        </div>
        <Link href={`${base}/articles/new`} className="button">
          <PenLine size={16} />
          Write a story
        </Link>
      </div>
      <div className="metric-grid">
        {[
          {
            label: "Total articles",
            key: "total",
            icon: FileText,
            note: "Across your workspace",
          },
          {
            label: "Published",
            key: "PUBLISHED",
            icon: Globe2,
            note: "Live on your publication",
          },
          {
            label: "In review",
            key: "IN_REVIEW",
            icon: CheckCheck,
            note: "Waiting for an editorial eye",
          },
          {
            label: "Scheduled",
            key: "SCHEDULED",
            icon: Clock3,
            note: "Ready for their moment",
          },
        ].map((m) => (
          <Link
            className="metric-card"
            key={m.key}
            href={`${base}/${m.key === "IN_REVIEW" ? "review" : "articles"}${m.key !== "total" && m.key !== "IN_REVIEW" ? `?status=${m.key}` : ""}`}
          >
            <span>
              {m.label}
              <m.icon size={18} />
            </span>
            <strong>{counts[m.key] ?? 0}</strong>
            <small>{m.note}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <h2>Recent stories</h2>
            <Link href={`${base}/articles`}>
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          <CmsTable articles={articles.slice(0, 6)} base={base} />
        </section>
        <aside className="panel editorial-note">
          <span className="eyebrow accent">THE EDITOR’S DESK</span>
          <h2>
            Good journalism
            <br />
            is a team effort.
          </h2>
          <p>
            Every fresh perspective deserves a thoughtful second look. Your next
            great story starts with a conversation.
          </p>
          <Link href={`${base}/review`} className="button secondary">
            Open review queue <ArrowUpRight size={16} />
          </Link>
          <div className="note-line" />
          <span className="eyebrow">YOUR WORKFLOW</span>
          <ol>
            <li>
              <span>01</span>Write & refine
            </li>
            <li>
              <span>02</span>Review & approve
            </li>
            <li>
              <span>03</span>Publish with confidence
            </li>
          </ol>
        </aside>
      </div>
    </>
  );
}
