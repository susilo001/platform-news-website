import { CmsShell } from "@/components/cms-shell";
export const metadata = {
  title: "Explore the newsroom",
  robots: { index: false, follow: false },
};
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CmsShell user={{ name: "Maya Santoso", role: "ADMIN" }} demo>
      {children}
    </CmsShell>
  );
}
