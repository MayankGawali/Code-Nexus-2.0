import { test, expect } from "@playwright/test";
test("README migrate seed and dev startup serve the credential-free seeded campaign", async ({
  page,
  context,
}) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === "127.0.0.1") return route.continue();
    external.push(u.origin);
    return route.abort();
  });
  await page.goto("/campaigns/aster");
  await expect(
    page.getByRole("heading", { name: "Aster Watch", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".asset-list .asset-row")).toHaveCount(3);
  await expect(page.locator(".asset-list .badge.good")).toHaveCount(3);
  await page
    .locator(".asset-list")
    .getByRole("link", { name: /Launch email/ })
    .click();
  await expect(page.getByTestId("draft-copy")).toHaveText(
    "up to 24 hours in standard mode.",
  );
  await expect(page.locator(".engine-note")).toContainText("local-watch-v2");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
