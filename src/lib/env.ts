import { z } from "zod";
const liveEnvironment = z.object({
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  SITE_URL: z.url(),
  PREVIEW_SECRET: z.string().min(32),
});
export function validateLiveEnvironment() {
  const result = liveEnvironment.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Missing or invalid live environment: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
}
