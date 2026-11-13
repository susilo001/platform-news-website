import { PublicHeader, PublicFooter } from "@/components/public-shell";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-container">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
