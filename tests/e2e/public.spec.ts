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
test("editor waits for hydration before accepting changes", async ({
  page,
}) => {
  let release!: () => void;
  const assets = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**", async (route) => {
    await assets;
    await route.continue();
  });
  const title = page.getByRole("textbox", {
    name: "Article title",
    exact: true,
  });
  try {
    await page.goto("/demo/articles/new", { waitUntil: "commit" });
    await expect(title).toBeDisabled();
  } finally {
    release();
  }
  await expect(title).toBeEnabled();
  await title.fill("A headline that survives editor initialization");
  await page
    .getByRole("textbox", { name: "Article summary", exact: true })
    .fill("A thoughtful summary for a new story.");
  await page
    .getByLabel("Article body", { exact: true })
    .fill("The body is ready for writing.");
  await expect(title).toHaveValue(
    "A headline that survives editor initialization",
  );
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
});
for (const route of ["/", "/search", "/demo", "/demo/articles/new"]) {
  test(`responsive page does not overflow: ${route}`, async ({ page }) => {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      outside: [...document.querySelectorAll("body *")]
        .map((el) => ({
          tag: el.tagName,
          cls: el.getAttribute("class"),
          right: Math.round(el.getBoundingClientRect().right),
          width: Math.round(el.getBoundingClientRect().width),
        }))
        .filter((el) => el.right > window.innerWidth + 1)
        .slice(0, 20),
    }));
    expect(
      dimensions.document,
      `${route} exceeds the viewport: ${JSON.stringify(dimensions)}`,
    ).toBeLessThanOrEqual(dimensions.viewport + 1);
    if (route === "/demo" && page.viewportSize()!.width < 650) {
      const table = page.locator(".table-scroll");
      // Wide data tables keep their own horizontal scrolling instead of widening the document.
      expect(
        await table.evaluate((el) => el.scrollWidth > el.clientWidth),
      ).toBe(true);
    }
  });
}
