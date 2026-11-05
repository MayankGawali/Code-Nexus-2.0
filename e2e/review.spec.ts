import { test, expect, type Page } from "@playwright/test";
test("review workbench supports the real workflow, exact highlights, scoped decisions and contrast", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [],
    external: string[] = [];
  const monitor = (p: Page) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
  };
  monitor(page);
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    external.push(url.origin);
    return route.abort();
  });
  async function fits(p = page) {
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  async function shot(name: string) {
    await fits();
    await page.screenshot({
      path: info.outputPath(name + ".png"),
      fullPage: false,
    });
  }
  async function edit(body: string, p = page) {
    await p.getByText("Edit draft", { exact: true }).click();
    await p.getByLabel("Revised copy").fill(body);
    await p.getByRole("button", { name: "Save revision", exact: true }).click();
    await expect(p.getByTestId("draft-copy")).toHaveText(body);
  }
  async function audit() {
    await page.getByRole("button", { name: /^(Run audit|Re-audit)$/ }).click();
    await expect(
      page.getByText("Deterministic local verification.", { exact: false }),
    ).toBeVisible();
  }
  async function approve() {
    await page
      .getByRole("button", { name: "Approve revision", exact: true })
      .click();
    await expect(page.getByText(/Approved for 2026-11-20/)).toBeVisible();
  }
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good creative. Grounded claims." }),
  ).toBeVisible();
  await shot("landing");
  await page.getByRole("button", { name: /Load Aster Watch demo/ }).click();
  await expect(
    page.getByRole("heading", { name: "Aster Watch", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("All current assets are approved")).toBeVisible();
  await shot("overview");
  await page.getByRole("link", { name: /Product page/ }).click();
  const phrase = "Up to 24 hours in standard mode";
  await edit(phrase + ". " + phrase + ".");
  await audit();
  await approve();
  await page.getByRole("link", { name: "Fact registry", exact: true }).click();
  await page.getByText("Battery life", { exact: true }).click();
  await page
    .getByLabel("New approved wording")
    .first()
    .fill("up to 18 hours in standard mode.");
  await page.getByLabel("Effective from").first().fill("2026-11-20");
  const longQuote =
    "Aster Standard laboratory specification: up to 18 hours in standard mode. " +
    "Battery testing methodology for this fictional product. ".repeat(24);
  await page
    .getByLabel("Source quote", { exact: true })
    .first()
    .fill(longQuote);
  await page
    .getByLabel("Reason for change")
    .first()
    .fill("Updated battery testing");
  await page
    .getByRole("button", { name: "Preview impact", exact: true })
    .first()
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Use one claim",
  );
  await expect(page.getByLabel("New approved wording").first()).toHaveValue(
    "up to 18 hours in standard mode.",
  );
  await page
    .getByLabel("New approved wording")
    .first()
    .fill("up to 18 hours in standard mode");
  await page
    .getByRole("button", { name: "Preview impact", exact: true })
    .first()
    .click();
  const preview = page.getByRole("region", { name: "Impact preview" });
  await expect(preview).toContainText("Product page");
  await expect(preview).toContainText("Launch email");
  await expect(preview).not.toContainText("Retail poster");
  await shot("impact-preview");
  await page
    .getByRole("button", { name: "Publish version", exact: true })
    .click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
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
  const second = page
    .getByRole("button", {
      name: /Up to 24 hours in standard mode.*Contradicted/,
    })
    .nth(1);
  await second.focus();
  await second.press("Enter");
  await expect(page.locator('[data-testid="draft-copy"] mark')).toHaveAttribute(
    "data-start",
    "33",
  );
  await expect(page.locator('[data-testid="draft-copy"] mark')).toHaveText(
    phrase,
  );
  await page.getByText("Original source quote", { exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Selected claim evidence" }),
  ).toContainText(longQuote);
  await shot("review-evidence");
  await page
    .getByRole("button", { name: "Accept suggested correction" })
    .click();
  await expect(page.getByTestId("draft-copy")).toHaveText(
    phrase + ". up to 18 hours in standard mode.",
  );
  await audit();
  await page
    .getByRole("button", { name: /Up to 24 hours.*Contradicted/ })
    .click();
  await page
    .getByRole("button", { name: "Accept suggested correction" })
    .click();
  await expect(page.getByTestId("draft-copy")).toHaveText(
    "up to 18 hours in standard mode. up to 18 hours in standard mode.",
  );
  await audit();
  await approve();
  await page.getByRole("link", { name: "← Aster Watch", exact: true }).click();
  await page.getByRole("link", { name: /Launch email/ }).click();
  await edit("18 hours with GPS enabled");
  await audit();
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await page.getByText("Override this finding", { exact: true }).click();
  await page
    .getByLabel("Override reason")
    .fill("Local demo reviewer accepts this limited placement");
  await page
    .getByRole("button", { name: "Override finding", exact: true })
    .click();
  await approve();
  await edit("Up to 18 hours in standard mode");
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await audit();
  await approve();
  await page
    .getByRole("link", { name: "Revision history", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Revision history", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Launch email", exact: true }).click();
  await expect(page).toHaveURL(/history\?asset=email/);
  await expect(
    page
      .getByRole("navigation", { name: "Filter history" })
      .getByRole("link", { name: "Launch email", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const comparison = page
    .locator(".ledger-revision")
    .first()
    .locator("details")
    .filter({
      has: page.getByText("Compare with previous revision", { exact: true }),
    })
    .first();
  await comparison.locator("summary").click();
  await expect(comparison).toHaveAttribute("open", "");

  await expect(
    page.getByText(/Claim 1:.*Insufficient evidence.*Supported/),
  ).toBeVisible();
  await expect(
    page.getByText("Local demo reviewer", { exact: false }).first(),
  ).toBeVisible();
  await shot("history");
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".asset-list")).toBeVisible();
  await page
    .locator(".asset-list")
    .getByRole("link", { name: /Retail poster/ })
    .click();
  await expect(page.getByText(/Approved for 2026-11-20/)).toBeVisible();
  await page.getByRole("button", { name: /Visual check/ }).click();
  await expect(page.getByTestId("poster-cta")).toHaveClass(/element-selected/);
  await expect(
    page.getByRole("region", { name: "Poster contrast check" }),
  ).toContainText("Supported");
  await page.getByLabel("Text foreground").fill("#777777");
  await page.getByLabel("Background colour").fill("#ffffff");
  await expect(page.locator(".contrast-preview")).toContainText("4.48:1");
  await expect(page.locator(".contrast-preview")).toContainText("Contradicted");
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Visual check/ }).click();
  await expect(page.locator(".ratio")).toHaveText("4.48:1");
  await shot("contrast-failure");
  await page.getByRole("button", { name: "Try accessible colours" }).click();
  await expect(page.locator(".contrast-preview")).toContainText("21.00:1");
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await approve();
  await page.getByRole("button", { name: /Visual check/ }).click();
  await page.getByLabel("Background type").selectOption("unsupported");
  await expect(page.locator(".contrast-preview")).toContainText(
    "Needs manual review",
  );
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await page.getByRole("button", { name: /Visual check/ }).click();
  await expect(page.locator(".ratio")).toHaveText("Not measurable");
  await expect(
    page.getByRole("button", { name: "Approve revision", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Try accessible colours" }).click();
  await page.getByRole("button", { name: "Save contrast revision" }).click();
  await approve();
  await page.getByRole("button", { name: /Visual check/ }).click();
  await shot("poster-corrected");
  // Competing browser tabs exercise a real stale-revision conflict.
  await page.goto("/campaigns/aster/email");
  await page.getByText("Edit draft", { exact: true }).click();
  await page.getByLabel("Revised copy").fill("black and silver");
  const competing = await context.newPage();
  monitor(competing);
  await competing.goto("/campaigns/aster/email");
  await edit("Up to 18 hours in standard mode. black and silver.", competing);
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Revision changed",
  );
  await expect(page.getByLabel("Revised copy")).toHaveValue("black and silver");
  await shot("stale-edit");
  await page.getByRole("link", { name: "Reload the current version" }).click();
  await expect(page.getByTestId("draft-copy")).toHaveText(
    "Up to 18 hours in standard mode. black and silver.",
  );
  await competing.close();
  // A brand-new fact follows the same preview/provenance path.
  await page.getByRole("link", { name: "Fact registry", exact: true }).click();
  await page.getByText("+ Add approved fact", { exact: true }).click();
  await page.getByLabel("Fact label", { exact: true }).fill("Positioning");
  await page
    .getByLabel("Approved wording", { exact: true })
    .fill("dual-band GPS");
  await page.getByLabel("Effective from").last().fill("2027-02-01");
  await page
    .getByLabel("Source quote", { exact: true })
    .last()
    .fill("Aster Standard: dual-band GPS");
  await page
    .getByLabel("Reason for change")
    .last()
    .fill("New positioning specification");
  await page.getByRole("button", { name: "Preview new fact" }).click();
  await expect(preview).toContainText("New fact: Aster Standard / Positioning");
  await page.getByRole("button", { name: "Publish version" }).click();
  await expect(page.getByText("Positioning", { exact: true })).toHaveCount(2);
  await fits();
  await page.setViewportSize({ width: 320, height: 740 });
  await fits();
  await shot("narrow-registry");
  for (const link of await page
    .getByRole("navigation", { name: "Campaign navigation" })
    .getByRole("link")
    .all())
    await expect(link).toBeInViewport();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
