import { z } from "zod";
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
const safeUrl = (url: unknown) =>
  typeof url === "string" && /^(https?:\/\/|\/(?!\/))/.test(url);
export const richNodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.object({
    type: z.enum([
      "doc",
      "paragraph",
      "text",
      "heading",
      "blockquote",
      "bulletList",
      "orderedList",
      "listItem",
      "hardBreak",
      "horizontalRule",
      "image",
    ]),
    text: z.string().max(100000).optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z
      .array(
        z.object({
          type: z.enum(["bold", "italic", "strike", "code", "link"]),
          attrs: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .optional(),
    content: z.array(richNodeSchema).max(1000).optional(),
  }),
);
export function parseBody(value: unknown): RichNode {
  if (JSON.stringify(value).length > 500000)
    throw new Error("Article body is too large.");
  const body = richNodeSchema.parse(value);
  if (body.type !== "doc") throw new Error("Invalid article document.");
  function check(n: RichNode, depth = 0) {
    if (depth > 30) throw new Error("Document nesting is too deep.");
    if (
      n.type === "image" &&
      (!safeUrl(n.attrs?.src) || !String(n.attrs?.alt ?? "").trim())
    )
      throw new Error("Images require a safe URL and alt text.");
    n.marks?.forEach((m) => {
      if (m.type === "link" && !safeUrl(m.attrs?.href))
        throw new Error("Invalid link URL.");
    });
    n.content?.forEach((c) => check(c, depth + 1));
  }
  check(body);
  return body;
}
export function bodyText(node: RichNode): string {
  return [node.text ?? "", ...(node.content ?? []).map(bodyText)]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
export const articleInput = z.object({
  id: z.string().optional(),
  version: z.coerce.number().int().min(0),
  title: z.string().trim().min(5).max(180),
  summary: z.string().trim().min(15).max(400),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160),
  categoryId: z.string().min(1),
  heroMediaId: z.string().optional(),
  seoTitle: z.string().max(180).default(""),
  seoDescription: z.string().max(320).default(""),
  tags: z.string().max(300).default(""),
  coauthorIds: z.array(z.string()).max(10).default([]),
  featured: z.boolean().default(false),
  bodyJson: z.unknown(),
});
