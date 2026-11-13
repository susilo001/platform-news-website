import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  CheckCheck,
  Image,
  Tags,
  Users,
  History,
  Settings,
  ArrowUpRight,
  PenLine,
  Radio,
} from "lucide-react";
import type { Role } from "@/modules/workflow/policy";
import { LogoutButton } from "@/components/logout-button";
const links = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/articles", label: "All articles", icon: FileText },
  { href: "/review", label: "Review queue", icon: CheckCheck },
  { href: "/media", label: "Media library", icon: Image },
  { href: "/categories", label: "Categories & tags", icon: Tags },
  { href: "/users", label: "Team members", icon: Users },
  { href: "/audit", label: "Activity log", icon: History },
  { href: "/settings", label: "Publication settings", icon: Settings },
];
export function CmsShell({
  children,
  user,
  demo = false,
}: {
  children: React.ReactNode;
  user: { name: string; role: Role };
  demo?: boolean;
}) {
  const base = demo ? "/demo" : "/cms";
  return (
    <div className="cms-app">
      <aside className="cms-sidebar">
        <Link href="/" className="wordmark">
          the current<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          <span className="live-dot" /> EDITORIAL WORKSPACE
        </div>
        <Link href={`${base}/articles/new`} className="button compose">
          <PenLine size={16} /> Write a story
        </Link>
        <span className="sidebar-section">WORKSPACE</span>
        <nav aria-label="Editorial navigation">
          {links
            .filter(
              (x) =>
                user.role !== "JOURNALIST" ||
                ["", "/articles", "/media"].includes(x.href),
            )
            .filter(
              (x) =>
                user.role === "ADMIN" ||
                !["/users", "/settings"].includes(x.href),
            )
            .map((x) => (
              <Link key={x.href} href={`${base}${x.href}`}>
                <x.icon size={18} />
                {x.label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">
            <ArrowUpRight size={17} />
            View publication
          </Link>
          <div className="staff-profile">
            <span className="staff-avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{demo ? "Demo workspace" : user.role.toLowerCase()}</small>
            </div>
            {!demo && <LogoutButton />}
          </div>
        </div>
      </aside>
      <div className="cms-main">
        <header className="cms-topbar">
          <span>
            <Radio size={14} /> The Current <span className="quiet">/</span>{" "}
            Newsroom
          </span>
          <div>
            <span className="status-live">
              <span className="live-dot" />
              {demo ? "Read-only demo" : "Workspace online"}
            </span>
            <Link href="/">
              Visit site <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            You’re viewing a sample newsroom. Explore the interface; changes are
            disabled. <Link href="/cms/login">Sign in to your workspace →</Link>
          </div>
        )}
        <main id="main" className="cms-content">
          {children}
        </main>
      </div>
    </div>
  );
}
