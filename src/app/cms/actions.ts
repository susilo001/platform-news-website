"use server";
import { revalidatePath } from "next/cache";
import { getActor } from "@/modules/auth/session";
import {
  saveArticle,
  transitionArticle,
  archiveDraft,
} from "@/modules/articles/service";
import { cmsArticle } from "@/modules/articles/cms-queries";
import { db } from "@/lib/db";
import {
  requireEditor,
  requireAdmin,
  type Status,
} from "@/modules/workflow/policy";
import { z } from "zod";
export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
  url?: string;
};
export async function saveStory(raw: unknown): Promise<ActionResult> {
  const actor = await getActor();
  try {
    const id = await saveArticle(actor, raw);
    revalidatePath("/cms", "layout");
    return { ok: true, id };
  } catch (e) {
    console.error("article.save.failed", { actor: actor.id, error: String(e) });
    return {
      ok: false,
      error:
        e instanceof z.ZodError
          ? e.issues[0].message
          : e instanceof Error && !e.message.includes("prisma")
            ? e.message
            : "Unable to save. Check the slug is unique and try again.",
    };
  }
}
export async function changeStatus(raw: {
  id: string;
  version: number;
  next: Status;
  reason: string;
  dueAt?: string;
}): Promise<ActionResult> {
  const actor = await getActor();
  try {
    const input = z
      .object({
        id: z.string(),
        version: z.number().int(),
        next: z.enum([
          "DRAFT",
          "IN_REVIEW",
          "APPROVED",
          "SCHEDULED",
          "PUBLISHED",
          "UNPUBLISHED",
        ]),
        reason: z.string().max(2000),
        dueAt: z.string().optional(),
      })
      .parse(raw);
    await transitionArticle(
      actor,
      input.id,
      input.version,
      input.next,
      input.reason,
      input.dueAt ? new Date(input.dueAt) : undefined,
    );
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unable to update article.",
    };
  }
}
export async function restoreRevision(
  articleId: string,
  revisionId: string,
  version: number,
): Promise<ActionResult> {
  const actor = await getActor();
  try {
    const article = await cmsArticle(actor, articleId);
    if (!article) return { ok: false, error: "Article not found." };
    const revision = await db.articleRevision.findFirstOrThrow({
      where: { id: revisionId, articleId },
    });
    const id = await saveArticle(actor, {
      id: articleId,
      version,
      title: revision.title,
      summary: revision.summary,
      slug: article.slug,
      categoryId: article.categoryId,
      heroMediaId: revision.heroMediaId ?? "",
      seoTitle: revision.seoTitle,
      seoDescription: revision.seoDescription,
      bodyJson: revision.bodyJson,
      tags: article.tags.map((t) => t.tag.name).join(","),
      coauthorIds: article.authors.map((a) => a.userId),
      featured: article.featured,
    });
    revalidatePath("/cms", "layout");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Restore failed.",
    };
  }
}
export async function saveCategory(form: FormData) {
  const actor = await getActor();
  requireEditor(actor);
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(60),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        description: z.string().max(300),
      })
      .parse(Object.fromEntries(form));
    await db.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { slug: input.slug },
        create: input,
        update: input,
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "Category",
          entityId: category.id,
          action: "CATEGORY_SAVED",
          metadata: input,
        },
      });
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to save category. Check the slug and fields.",
    };
  }
}

export async function saveStaff(form: FormData) {
  const actor = await getActor();
  requireAdmin(actor);
  try {
    const input = z
      .object({
        email: z.email().transform((s) => s.toLowerCase()),
        name: z.string().trim().min(2).max(80),
        role: z.enum(["ADMIN", "EDITOR", "JOURNALIST"]),
        publicSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        active: z.enum(["true", "false"]),
      })
      .parse(Object.fromEntries(form));
    if (
      input.email === actor.email &&
      (input.active === "false" || input.role !== "ADMIN")
    )
      throw new Error("You cannot remove your own admin access.");
    await db.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: input.email },
        create: { ...input, active: input.active === "true" },
        update: { ...input, active: input.active === "true" },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "User",
          entityId: user.id,
          action: "STAFF_UPDATED",
          metadata: { role: input.role, active: input.active },
        },
      });
    });
    revalidatePath("/cms/users");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Unable to save team member. Check the email, author slug, and role.",
    };
  }
}

export async function saveSettings(form: FormData) {
  const actor = await getActor();
  requireAdmin(actor);
  try {
    const value = z
      .object({
        timezone: z.string().refine((v) => {
          try {
            new Intl.DateTimeFormat("en", { timeZone: v });
            return true;
          } catch {
            return false;
          }
        }, "Invalid timezone"),
        description: z.string().trim().min(10).max(300),
      })
      .parse(Object.fromEntries(form));
    await db.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key: "publication" },
        create: { key: "publication", valueJson: value, updatedBy: actor.id },
        update: { valueJson: value, updatedBy: actor.id },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityType: "SiteSetting",
          entityId: "publication",
          action: "SETTINGS_UPDATED",
          metadata: value,
        },
      });
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to save settings. Check the timezone and description.",
    };
  }
}

export async function deleteDraft(
  id: string,
  version: number,
  reason: string,
): Promise<ActionResult> {
  const actor = await getActor();
  try {
    await archiveDraft(actor, id, version, reason);
    revalidatePath("/cms", "layout");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && !e.message.includes("prisma")
          ? e.message
          : "Unable to delete draft.",
    };
  }
}
