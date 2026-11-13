import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isDemo } from "@/lib/config";
import { redirect } from "next/navigation";
export async function getActor() {
  if (isDemo) redirect("/cms/login");
  const session = await auth();
  if (!session?.user?.email) redirect("/cms/login");
  // Re-query on every request: role changes and deactivation take effect immediately.
  const user = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });
  if (!user?.active) redirect("/cms/login?error=AccessDenied");
  return user;
}
