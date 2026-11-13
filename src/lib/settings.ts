import { db } from "@/lib/db";
import { isDemo } from "@/lib/config";
export async function getSettings() {
  if (isDemo)
    return {
      timezone: "Asia/Jakarta",
      description: "Independent journalism. A wider perspective.",
    };
  const row = await db.siteSetting.findUnique({
    where: { key: "publication" },
  });
  const value = row?.valueJson as
    { timezone?: string; description?: string } | undefined;
  return {
    timezone: value?.timezone ?? "Asia/Jakarta",
    description:
      value?.description ?? "Independent journalism. A wider perspective.",
  };
}
