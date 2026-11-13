import { test, expect } from "@playwright/test";
test("reader can discover, read, and search a story", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "The cities rewriting the rules of urban living",
    }),
  ).toBeVisible();
  await page
    .getByRole("heading", {
      name: "The cities rewriting the rules of urban living",
    })
    .getByRole("link")
    .click();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    1,
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText("cities");
  await page.getByRole("link", { name: "Search stories" }).click();
  await page.getByRole("searchbox", { name: "Search stories" }).fill("cities");
  await page.getByRole("button", { name: /^Search/ }).click();
  await expect(page.getByText(/stories for|story for/)).toBeVisible();
});
test("no results and unknown article are handled", async ({ page }) => {
  await page.goto("/search?q=zzzzzznothing");
  await expect(
    page.getByRole("heading", { name: "No stories found." }),
  ).toBeVisible();
  const r = await page.goto("/news/nonexistent-draft");
  expect(r?.status()).toBe(404);
});
test("staff routes stay protected", async ({ page }) => {
  await page.goto("/cms/articles");
  await expect(page).toHaveURL(/\/cms\/login/);
  await expect(
    page.getByRole("heading", { name: "Let’s get to work." }),
  ).toBeVisible();
});
test("demo editor cannot save", async ({ page }) => {
  await page.goto("/demo/articles/new");
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Article title", exact: true })
    .fill("A new perspective");
  await expect(
    page.getByRole("textbox", { name: "Article title", exact: true }),
  ).toHaveValue("A new perspective");
});
test("responsive pages do not overflow", async ({ page }) => {
  for (const route of ["/", "/search", "/demo", "/demo/articles/new"]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
});
