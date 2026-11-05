import { it, expect } from "vitest";
import { connect, migrate } from "../lib/db";
import { seed } from "../lib/seed";
import { contrastRatio, checkContrast, defaultPoster } from "../lib/contrast";
import * as r from "../lib/review";
import { visualFindings, posterStyle } from "../lib/visual";
it.each([
  ["#000000", "#ffffff", 21],
  ["#ffffff", "#ffffff", 1],
  ["#777777", "#ffffff", 4.478089453577214],
])("measures %s on %s", (a, b, ratio) =>
  expect(contrastRatio(a, b)).toBeCloseTo(ratio, 10),
);
it("uses full precision and fails closed for unknown backgrounds", () => {
  expect(
    checkContrast({
      foreground: "#777777",
      background: "#ffffff",
      kind: "solid",
    }).verdict,
  ).toBe("Contradicted");
  expect(checkContrast(defaultPoster).verdict).toBe("Supported");
  expect(
    checkContrast({ ...defaultPoster, kind: "unsupported" }),
  ).toMatchObject({ verdict: "Needs manual review", ratio: null });
  expect(checkContrast()).toMatchObject({
    verdict: "Needs manual review",
    ratio: null,
  });
});
it("persists visual findings separately, inherits template style, and gates approval", () => {
  const db = connect(":memory:");
  try {
    migrate(db);
    seed(db);
    const original = r.revisions(db, "poster")[0];
    expect(r.status(db, "poster")).toBe("Approved");
    const revision = r.revisePoster(
      db,
      "poster",
      original.id,
      { foreground: "#777777", background: "#ffffff", kind: "solid" },
      "contrast-save",
    );
    expect(
      r.revisePoster(
        db,
        "poster",
        original.id,
        { foreground: "#777777", background: "#ffffff", kind: "solid" },
        "contrast-save",
      ),
    ).toBe(revision);
    const run = r.audits(db, revision)[0];
    expect(r.findings(db, run.id)[0].verdict).toBe("Supported");
    expect(visualFindings(db, run.id)[0]).toMatchObject({
      verdict: "Contradicted",
      ratio: expect.any(Number),
    });
    expect(() => r.approve(db, run.id)).toThrow();
    expect(posterStyle(db, original.id)).toEqual(defaultPoster);
    const corrected = r.revisePoster(db, "poster", revision, {
      foreground: "#000000",
      background: "#ffffff",
      kind: "solid",
    });
    r.approve(db, r.audits(db, corrected)[0].id);
    expect(r.status(db, "poster")).toBe("Approved");
    const unknown = r.revisePoster(db, "poster", corrected, {
      foreground: "#000000",
      background: "image",
      kind: "unsupported",
    });
    expect(visualFindings(db, r.audits(db, unknown)[0].id)[0]).toMatchObject({
      verdict: "Needs manual review",
      ratio: null,
    });
    expect(() => r.approve(db, r.audits(db, unknown)[0].id)).toThrow();
    expect(() => db.exec("DELETE FROM visual_finding")).toThrow(/Immutable/);
  } finally {
    db.close();
  }
});
