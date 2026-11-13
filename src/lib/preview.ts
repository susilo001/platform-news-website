import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const payloadSchema = z.object({
  articleId: z.string(),
  revisionId: z.string(),
  actorId: z.string(),
  expires: z.number(),
});
function secret() {
  const key = process.env.PREVIEW_SECRET;
  if (!key || key.length < 32)
    throw new Error("Configure a PREVIEW_SECRET of at least 32 characters.");
  return key;
}
export function signPreview(payload: z.infer<typeof payloadSchema>) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${createHmac("sha256", secret()).update(value).digest("base64url")}`;
}
export function verifyPreview(token: string, now = Date.now()) {
  try {
    if (token.length > 2048) return null;
    const [value, signature, extra] = token.split(".");
    if (!value || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(value).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const p = payloadSchema.parse(
      JSON.parse(Buffer.from(value, "base64url").toString()),
    );
    return p.expires > now ? p : null;
  } catch {
    return null;
  }
}
