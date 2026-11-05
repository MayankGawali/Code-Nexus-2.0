import { test, expect, type Page } from "@playwright/test";
test("seeded judge journey uses new inputs, persists evidence, and rejects obsolete approval", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [],
    external: string[] = [];
  function monitor(p: Page) {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
  }
  monitor(page);
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === "127.0.0.1") return route.continue();
    external.push(u.origin);
    return route.abort();
  });
  const day = "2027-02-01",
    replacement = 17;
  async function audit(p = page) {
    await p.getByRole("button", { name: /^(Run audit|Re-audit)$/ }).click();
    await expect(p.locator(".engine-note")).toContainText(day);
  }
  async function approve(p = page) {
    await p
      .getByRole("button", { name: "Approve revision", exact: true })
      .click();
    await expect(p.locator(".approval-note")).toContainText(day);
  }
  async function edit(body: string, p = page) {
    await p.getByText("Edit draft", { exact: true }).click();
    await p.getByLabel("Revised copy").fill(body);
    await p.getByRole("button", { name: "Save revision", exact: true }).click();
    await expect(p.getByTestId("draft-copy")).toHaveText(body);
  }
  async function overview() {
    await page.goto("/campaigns/aster");
    await expect(page.locator(".asset-list")).toBeVisible();
  }
  async function screenshot(name: string) {
    await page.screenshot({ path: info.outputPath(name + ".png") });
  }
  await overview();
  await expect(page.locator(".asset-list .asset-row")).toHaveCount(3);
  await expect(page.locator(".asset-list .badge.good")).toHaveCount(3);
  // Select the same future publication date through real application actions.
  for (const slug of ["product", "email", "poster"]) {
    await page.goto("/campaigns/aster/" + slug);
    await page.getByLabel("Publication date").fill(day);
    await audit();
    await approve();
  }
  await overview();
  await expect(page.locator(".asset-list .badge.good")).toHaveCount(3);
  await page.getByRole("link", { name: "Fact registry", exact: true }).click();
  await page.getByText("Battery life", { exact: true }).click();
  await page
    .getByLabel("New approved wording")
    .first()
    .fill("up to " + replacement + " hours in standard mode");
  await page.getByLabel("Effective from").first().fill(day);
  await page
    .getByLabel("Source quote", { exact: true })
    .first()
    .fill(
      "Fictional live benchmark: up to " +
        replacement +
        " hours in standard mode",
    );
  await page
    .getByLabel("Reason for change")
    .first()
    .fill("Judge selected a new replacement value");
  await page
    .getByRole("button", { name: "Preview impact", exact: true })
    .first()
    .click();
  const preview = page.getByRole("region", { name: "Impact preview" });
  await expect(preview.locator(".impact-row")).toHaveCount(2);
  await expect(preview).toContainText("Launch email");
  await expect(preview).toContainText("Product page");
  await expect(preview).not.toContainText("Retail poster");
  await expect(preview).toContainText("up to 17 hours in standard mode");
  await screenshot("judge-impact");
  await page.getByRole("button", { name: "Publish version" }).click();
  await overview();
  await expect(page.locator(".asset-list .badge.warn")).toHaveCount(2);
  await expect(
    page.locator(".asset-list").getByRole("link", { name: /Retail poster/ }),
  ).toContainText("Approved");
  await page
    .locator(".asset-list")
    .getByRole("link", { name: /Launch email/ })
    .click();
  await expect(page.locator('[data-testid="draft-copy"] mark')).toHaveText(
    "up to 24 hours in standard mode",
  );
  await expect(page.locator('[data-testid="draft-copy"] mark')).toHaveAttribute(
    "data-start",
    "0",
  );
  const evidence = page.getByRole("region", {
    name: "Selected claim evidence",
  });
  await expect(evidence).toContainText("up to 17 hours in standard mode");
  await expect(evidence).toContainText("Effective " + day);
  await expect(evidence).toContainText("Contradicted");
  await screenshot("judge-email-evidence");
  await edit("Up to " + replacement + " hours with GPS enabled");
  await audit();
  await expect(evidence).toContainText("Insufficient evidence");
  await expect(evidence).toContainText("Draft condition");
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await edit("Up to " + replacement + " hours in standard mode");
  await audit();
  await expect(evidence).toContainText("Supported");
  await expect(page.locator(".toolbar-status")).toContainText("In review");
  await approve();
  await page.reload();
  await expect(page.locator(".approval-note")).toContainText(day);
  await expect(page.getByTestId("draft-copy")).toHaveText(
    "Up to 17 hours in standard mode",
  );
  await page
    .getByRole("link", {
      name: "View all revisions & original evidence",
      exact: false,
    })
    .click();
  await expect(page).toHaveURL(/history\?asset=email/);
  await expect(page.locator(".ledger-revision").first()).toContainText(
    "Approved",
  );
  await page
    .locator(".ledger-revision")
    .last()
    .locator("summary")
    .first()
    .click();
  await expect(page.locator(".ledger-revision").last()).toContainText(
    "up to 24 hours in standard mode",
  );
  await expect(page.locator(".ledger-revision").last()).toContainText(
    "battery / V1",
  );
  await expect(page.locator(".history-log")).toContainText(
    "Judge selected a new replacement value",
  );
  await screenshot("judge-persisted-history");
  await page.reload();
  await expect(page.locator(".ledger-revision").first()).toContainText(
    "Approved",
  );
  await overview();
  await expect(
    page.locator(".asset-list").getByRole("link", { name: /Retail poster/ }),
  ).toContainText("Approved");
  await page
    .locator(".asset-list")
    .getByRole("link", { name: /Retail poster/ })
    .click();
  await page.getByRole("button", { name: /Visual check/ }).click();
  await expect(page.locator(".ratio")).not.toHaveText("Not measurable");
  await page.getByLabel("Text foreground").fill("#777777");
  await page.getByLabel("Background colour").fill("#ffffff");
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Visual check/ }).click();
  await expect(page.locator(".ratio")).toHaveText("4.48:1");
  await page.getByRole("button", { name: "Try accessible colours" }).click();
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await approve();
  await screenshot("judge-contrast-fixed");
  // Leave a supported but unapproved revision open, then change it in another tab.
  await page.goto("/campaigns/aster/email");
  await edit("Up to 17 hours in standard mode.");
  await audit();
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toBeVisible();
  const newer = await context.newPage();
  monitor(newer);
  await newer.goto("/campaigns/aster/email");
  await edit("black and silver", newer);
  await page
    .getByRole("button", { name: "Approve revision", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "current revision",
  );
  await screenshot("judge-stale-approval");
  await newer.reload();
  await expect(newer.getByTestId("draft-copy")).toHaveText("black and silver");
  await expect(newer.locator(".toolbar-status")).toContainText("In review");
  await expect(
    newer.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await newer.close();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
