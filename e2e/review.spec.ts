import { test, expect } from "@playwright/test";
test("reviewer traces changed evidence, corrects a claim and approves the new revision", async ({
  page,
}) => {
  const external: string[] = [];
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    external.push(url.origin);
    return route.abort();
  });
  await page.goto("/");
  await page.getByRole("link", { name: /LAUNCH CAMPAIGN/ }).click();
  await expect(
    page.getByRole("heading", { name: "Aster Watch" }),
  ).toBeVisible();
  await page.getByText("Battery life", { exact: true }).click();
  await page
    .getByLabel("New approved wording")
    .first()
    .fill("up to 18 hours in standard mode");
  await page.getByLabel("Effective from").first().fill("2026-11-20");
  await page.getByRole("button", { name: "Publish version" }).first().click();
  await expect(page.getByRole("link", { name: /Product page/ })).toContainText(
    "Needs review",
  );
  await expect(page.getByRole("link", { name: /Launch email/ })).toContainText(
    "Needs review",
  );
  await expect(page.getByRole("link", { name: /Retail poster/ })).toContainText(
    "Approved",
  );
  await page.getByRole("link", { name: /Product page/ }).click();
  await expect(
    page.getByText(/Evidence changed — review required/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run audit" }).click();
  await expect(page.getByText(/Unsupported: no exact/)).toBeVisible();
  await page.getByText("Correct claim", { exact: true }).click();
  await page
    .getByLabel("Revised copy")
    .fill("up to 18 hours in standard mode.");
  await page.getByRole("button", { name: "Save revision" }).click();
  await expect(page.getByText(/No audit yet/)).toBeVisible();
  await page.getByRole("button", { name: "Run audit" }).click();
  await page.getByRole("button", { name: "Approve revision" }).click();
  await expect(page.getByText(/Decision #4/)).toContainText("Evidence current");
  await expect(page.getByText(/Decision #1/)).toContainText("Evidence changed");
  expect(external).toEqual([]);
});
