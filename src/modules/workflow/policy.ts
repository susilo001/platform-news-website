export type Role = "ADMIN" | "EDITOR" | "JOURNALIST";
export type Status =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UNPUBLISHED";
export type Actor = { id: string; role: Role; active: boolean };
export function requireActive(actor: Actor) {
  if (!actor.active) throw new Error("Account is inactive.");
}
export function requireEditor(actor: Actor) {
  requireActive(actor);
  if (actor.role === "JOURNALIST")
    throw new Error("Editor permission required.");
}
export function requireAdmin(actor: Actor) {
  requireActive(actor);
  if (actor.role !== "ADMIN") throw new Error("Admin permission required.");
}
export function canEdit(
  actor: Actor,
  article: { leadAuthorId: string; status: Status },
) {
  return (
    actor.active &&
    (actor.role !== "JOURNALIST" || actor.id === article.leadAuthorId) &&
    article.status === "DRAFT"
  );
}
const transitions: Record<Status, Status[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: ["PUBLISHED", "SCHEDULED"],
  SCHEDULED: ["DRAFT"],
  PUBLISHED: ["UNPUBLISHED"],
  UNPUBLISHED: ["DRAFT"],
};
export function assertTransition(
  actor: Actor,
  article: { leadAuthorId: string; status: Status; authorIds?: string[] },
  next: Status,
  reason = "",
  dueAt?: Date,
) {
  requireActive(actor);
  if (!transitions[article.status].includes(next))
    throw new Error(`Cannot move ${article.status} to ${next}.`);
  if (next === "IN_REVIEW") {
    if (actor.role === "JOURNALIST" && actor.id !== article.leadAuthorId)
      throw new Error("Only the lead author can submit this article.");
  } else requireEditor(actor);
  const isAuthor =
    actor.id === article.leadAuthorId || article.authorIds?.includes(actor.id);
  if (
    next === "APPROVED" &&
    isAuthor &&
    (actor.role !== "ADMIN" || !reason.trim())
  )
    throw new Error(
      "A different editor must approve. Admin override requires a reason.",
    );
  if (
    (next === "UNPUBLISHED" ||
      (article.status === "IN_REVIEW" && next === "DRAFT")) &&
    !reason.trim()
  )
    throw new Error("An editorial reason is required.");
  if (
    next === "SCHEDULED" &&
    (!dueAt || !Number.isFinite(dueAt.getTime()) || dueAt <= new Date())
  )
    throw new Error("Choose a future publication time.");
}
export function isPublicArticle(
  article: {
    status: Status;
    publishedAt: Date | null;
    publishedRevisionId: string | null;
  },
  now = new Date(),
) {
  return (
    article.status === "PUBLISHED" &&
    !!article.publishedRevisionId &&
    !!article.publishedAt &&
    article.publishedAt <= now
  );
}
