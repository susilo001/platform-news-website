import { afterEach, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { $transaction: transaction } }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  transaction.mockReset();
});
const actor = { id: "editor", role: "EDITOR" as const, active: true };
it("rejects scheduled publication before creating database work when disabled", async () => {
  vi.stubEnv("SCHEDULING_ENABLED", "false");
  const { transitionArticle } = await import("@/modules/articles/service");
  await expect(
    transitionArticle(
      actor,
      "article",
      1,
      "SCHEDULED",
      "",
      new Date(Date.now() + 60000),
    ),
  ).rejects.toThrow(/Scheduled publishing is disabled/);
  expect(transaction).not.toHaveBeenCalled();
});
it.each(["PUBLISHED", "UNPUBLISHED", "DRAFT"] as const)(
  "continues to run normal validation for %s when scheduling is disabled",
  async (next) => {
    vi.stubEnv("SCHEDULING_ENABLED", "false");
    transaction.mockRejectedValue(new Error("transaction validation"));
    const { transitionArticle } = await import("@/modules/articles/service");
    await expect(
      transitionArticle(actor, "article", 1, next, "reason"),
    ).rejects.toThrow("transaction validation");
    expect(transaction).toHaveBeenCalledOnce();
  },
);
it("keeps worker deployments compatible when scheduling is enabled", async () => {
  vi.stubEnv("SCHEDULING_ENABLED", "true");
  transaction.mockRejectedValue(new Error("transaction validation"));
  const { transitionArticle } = await import("@/modules/articles/service");
  await expect(
    transitionArticle(
      actor,
      "article",
      1,
      "SCHEDULED",
      "",
      new Date(Date.now() + 60000),
    ),
  ).rejects.toThrow("transaction validation");
  expect(transaction).toHaveBeenCalledOnce();
});
