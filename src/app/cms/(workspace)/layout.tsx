import { getActor } from "@/modules/auth/session";
import { CmsShell } from "@/components/cms-shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Editorial workspace",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActor();
  return <CmsShell user={user}>{children}</CmsShell>;
}
