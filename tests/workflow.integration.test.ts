import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect, migrate, type DB } from "../lib/db";
import { seed } from "../lib/seed";
import * as r from "../lib/review";
import * as w from "../lib/workflow";
import { selectedDate } from "../lib/context";

describe("review workflow in a real temporary SQLite database", () => {
  let dir: string, db: DB, other: DB;
  const before = "2027-01-31",
    boundary = "2027-02-01";
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "prometheus-workflow-"));
    db = connect(join(dir, "review.sqlite"));
    migrate(db);
    seed(db);
    other = connect(join(dir, "review.sqlite"));
  });
  afterEach(() => {
    other.close();
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  it("previews new facts before writing them, resolves missing same-variant evidence and retries safely", () => {
    const revision = r.revise(
      db,
      "email",
      r.revisions(db, "email")[0].id,
      "dual-band GPS",
    );
    const run = w.auditSelected(db, "email", revision, boundary);
    expect(r.findings(db, run)[0].verdict).toBe("Insufficient evidence");
    const initial = r.facts(db).length;
    expect(() =>
      w.newFactPreview(
        db,
        "Aster Standard",
        "Positioning",
        "dual-band GPS",
        boundary,
        "",
        "New specification",
      ),
    ).toThrow();
    const token = w.newFactPreview(
      db,
      "Aster Standard",
      "Positioning",
      "dual-band GPS",
      boundary,
      "Aster Standard now supports dual-band GPS",
      "New specification",
    );
    expect(r.facts(db)).toHaveLength(initial);
    expect(
      w.previews(db, token)!.impact.find((a) => a.asset === "email"),
    ).toMatchObject({ dependency: false, changed: true, after: ["Supported"] });
    const version = w.publishPreview(db, token);
    expect(w.publishPreview(other, token)).toBe(version);
    expect(r.facts(db)).toHaveLength(initial + 1);
    const audit = r.audits(db, revision)[0],
      finding = r.findings(db, audit.id)[0];
    expect(finding.verdict).toBe("Supported");
    expect(r.sources(db, finding.id).map((v) => v.id)).toEqual([version]);
    expect(r.status(db, "email")).toBe("In review");
    r.approve(db, audit.id);
    expect(r.status(db, "email")).toBe("Approved");
  });
  const counts = () =>
    [
      "version",
      "closure",
      "source_change",
      "audit",
      "revision",
      "decision",
      "finding_override",
    ].map((t) => db.prepare("SELECT count(*) n FROM " + t).get()!.n);
  function setupDates() {
    for (const day of [before, boundary])
      for (const asset of ["product", "email", "poster"]) {
        const run = w.auditSelected(
          db,
          asset,
          r.revisions(db, asset)[0].id,
          day,
        );
        r.approve(db, run);
      }
  }
  function preview(word = "up to 18 hours in standard mode") {
    return w.impactPreview(
      db,
      "battery",
      r.versions(db, "battery")[0].id,
      word,
      boundary,
      "Aster Standard specification: up to 18 hours in standard mode",
      "Updated battery test results",
    );
  }
  it("implements the February boundary, GPS correction and explicit approval scenario", () => {
    setupDates();
    for (const id of ["product", "email", "poster"]) {
      expect(r.status(db, id, before)).toBe("Approved");
      expect(r.status(db, id, boundary)).toBe("Approved");
    }
    const decisions = r.decisions(db, "email");
    const token = preview(),
      impact = w.previews(db, token)!.impact;
    expect(
      impact
        .filter((i) => i.changed)
        .map((i) => i.asset)
        .sort(),
    ).toEqual(["email", "product"]);
    expect(impact.every((i) => i.dependency)).toBe(true);
    const version = w.publishPreview(db, token),
      saved = counts();
    expect(w.publishPreview(other, token)).toBe(version);
    expect(counts()).toEqual(saved);
    expect(w.provenance(db, version)).toMatchObject({
      reason: "Updated battery test results",
      quote: expect.stringContaining("18 hours"),
    });
    expect(
      ["product", "email", "poster"].map((id) => r.status(db, id, before)),
    ).toEqual(["Approved", "Approved", "Approved"]);
    expect(
      ["product", "email", "poster"].map((id) => r.status(db, id, boundary)),
    ).toEqual(["Needs review", "Needs review", "Approved"]);
    expect(r.decisions(db, "email")).toEqual(decisions);
    const oldEmail = r.revisions(db, "email")[0].id;
    const gps = r.revise(
      db,
      "email",
      oldEmail,
      "18 hours with GPS enabled",
      "save-gps",
    );
    expect(
      r.revise(
        other,
        "email",
        oldEmail,
        "18 hours with GPS enabled",
        "save-gps",
      ),
    ).toBe(gps);
    const gpsAudit = w.auditSelected(db, "email", gps, boundary, "audit-gps");
    expect(r.findings(db, gpsAudit)[0].verdict).toBe("Insufficient evidence");
    expect(() => r.approve(db, gpsAudit)).toThrow();
    const fixed = r.revise(
      db,
      "email",
      gps,
      "Up to 18 hours in standard mode",
      "save-fixed",
    );
    const fixedAudit = w.auditSelected(db, "email", fixed, boundary);
    expect(r.findings(db, fixedAudit)[0].verdict).toBe("Supported");
    expect(r.status(db, "email")).toBe("In review");
    expect(r.compareRevision(db, fixedAudit)).toMatchObject({
      previous: gps,
      baseline: gpsAudit,
      changes: [
        {
          before: { verdict: "Insufficient evidence" },
          after: { verdict: "Supported" },
        },
      ],
    });
    const decision = r.approve(db, fixedAudit);
    expect(r.approve(other, fixedAudit)).toBe(decision);
    expect(r.status(db, "email")).toBe("Approved");
    expect(r.decisions(db, "email")).toHaveLength(decisions.length + 1);
    expect(
      w
        .history(db)
        .some(
          (e) =>
            e.kind === "source" && e.detail.includes("Updated battery test"),
        ),
    ).toBe(true);
  });
  it("previews unchanged January evidence and leaves those approvals current", () => {
    for (const asset of ["product", "email", "poster"])
      r.approve(
        db,
        w.auditSelected(db, asset, r.revisions(db, asset)[0].id, before),
      );
    const token = preview(),
      auditCount = db.prepare("SELECT count(*) n FROM audit").get()!.n;
    expect(w.previews(db, token)!.impact.every((i) => !i.changed)).toBe(true);
    w.publishPreview(db, token);
    expect(db.prepare("SELECT count(*) n FROM audit").get()!.n).toBe(
      auditCount,
    );
    expect(
      ["product", "email", "poster"].map((id) => r.status(db, id)),
    ).toEqual(["Approved", "Approved", "Approved"]);
  });
  it("rejects competing revisions, stale previews and stale audit approvals", () => {
    setupDates();
    const token = preview(),
      rev = r.revisions(db, "email")[0].id;
    const priorAudit = r.auditRevision(db, rev, boundary);
    const next = r.revise(
      other,
      "email",
      rev,
      "black and silver",
      "competing-save",
    );
    expect(() =>
      r.revise(
        db,
        "email",
        rev,
        "Up to 18 hours in standard mode",
        "different-save",
      ),
    ).toThrow(/Revision changed/);
    expect(() =>
      r.revise(db, "email", rev, "different payload", "competing-save"),
    ).toThrow(/token/);
    expect(() => r.approve(db, priorAudit)).toThrow(/current revision/);
    // A late result is still saved against the captured old revision.
    const late = r.auditRevision(db, rev, boundary);
    expect(r.audits(db, rev).some((a) => a.id === late)).toBe(true);
    expect(() => r.approve(db, late)).toThrow();
    expect(r.revisions(db, "email")[0].id).toBe(next);
    const oldCounts = counts();
    expect(() => w.publishPreview(db, token)).toThrow(/Workspace changed/);
    expect(counts()).toEqual(oldCounts);
  });
  it("accepts a proposal as an immutable revision with retry safety", () => {
    setupDates();
    w.publishPreview(db, preview());
    const rev = r.revisions(db, "product")[0],
      run = r.audits(db, rev.id)[0],
      finding = r.findings(db, run.id)[0];
    const next = r.acceptSuggestion(
      db,
      finding.id,
      rev.id,
      "accept-correction",
    );
    expect(
      r.acceptSuggestion(other, finding.id, rev.id, "accept-correction"),
    ).toBe(next);
    expect(r.revisions(db, "product")[0].body).toBe(
      "up to 18 hours in standard mode.",
    );
    expect(r.revisions(db, "product").find((v) => v.id === rev.id)?.body).toBe(
      rev.body,
    );
    expect(r.status(db, "product")).toBe("In review");
    expect(() =>
      r.acceptSuggestion(db, finding.id, rev.id, "stale-accept"),
    ).toThrow(/Revision changed/);
  });
  it("binds overrides to one finding, revision and evidence context, with required reasons", () => {
    setupDates();
    const id = r.revise(
      db,
      "email",
      r.revisions(db, "email")[0].id,
      "18 hours with GPS enabled",
    );
    const run = w.auditSelected(db, "email", id, boundary),
      finding = r.findings(db, run)[0];
    expect(() => r.overrideFinding(db, finding.id, " ")).toThrow();
    const override = r.overrideFinding(
      db,
      finding.id,
      "Reviewer accepts this limited placement",
      "override-once",
    );
    expect(
      r.overrideFinding(
        other,
        finding.id,
        "Reviewer accepts this limited placement",
        "override-once",
      ),
    ).toBe(override);
    r.approve(db, run);
    expect(r.status(db, "email")).toBe("Approved");
    const newAudit = r.auditRevision(db, id, boundary);
    expect(() => r.approve(db, newAudit)).toThrow();
    // The claim has no supported dependency; new metric evidence must still revisit it.
    const token = preview();
    expect(
      w.previews(db, token)!.impact.find((a) => a.asset === "email"),
    ).toMatchObject({ dependency: false, changed: true });
    w.publishPreview(db, token);
    expect(r.status(db, "email")).toBe("Needs review");
    expect(r.overrides(db, run)).toHaveLength(1);
    expect(() => r.overrideFinding(db, finding.id, "Another reason")).toThrow(
      /stale/,
    );
    const next = r.revise(db, "email", id, "18 hours with GPS enabled");
    const nextAudit = w.auditSelected(db, "email", next, boundary);
    expect(r.overrides(db, nextAudit)).toEqual([]);
    expect(() => r.approve(db, nextAudit)).toThrow();
  });
  it("rolls back the source change if a dependent audit fails", () => {
    setupDates();
    const token = preview(),
      oldCounts = counts();
    db.exec(
      "CREATE TRIGGER fail_audit BEFORE INSERT ON audit BEGIN SELECT raise(ABORT,'Simulated audit write failure'); END",
    );
    expect(() => w.publishPreview(db, token)).toThrow(/Simulated/);
    expect(counts()).toEqual(oldCounts);
    expect(r.versions(db, "battery")[0].until).toBeNull();
  });
  it("reconsiders an unresolved claim without supported dependencies and still requires approval", () => {
    setupDates();
    const revision = r.revise(
      db,
      "email",
      r.revisions(db, "email")[0].id,
      "Up to 18 hours in standard mode",
    );
    const run = w.auditSelected(db, "email", revision, boundary);
    expect(r.findings(db, run)[0].verdict).toBe("Insufficient evidence");
    const first = preview(),
      competing = preview();
    expect(
      w.previews(db, first)!.impact.find((i) => i.asset === "email"),
    ).toMatchObject({ dependency: false, changed: true, after: ["Supported"] });
    w.publishPreview(db, first);
    const audit = r.audits(db, revision)[0];
    expect(r.findings(db, audit.id)[0].verdict).toBe("Supported");
    expect(r.status(db, "email")).toBe("In review");
    expect(() => w.publishPreview(other, competing)).toThrow(
      /Workspace changed/,
    );
    expect(r.versions(db, "battery")).toHaveLength(2);
    r.approve(db, audit.id);
    expect(r.status(db, "email")).toBe("Approved");
  });
  it("keeps publication selection in the database and rejects an outdated selection action", () => {
    const rev = r.revisions(db, "email")[0].id;
    const run = w.auditSelected(db, "email", rev, boundary, "choose-date");
    expect(w.auditSelected(other, "email", rev, boundary, "choose-date")).toBe(
      run,
    );
    expect(selectedDate(other, "email")).toBe(boundary);
    r.revise(other, "email", rev, "black and silver");
    expect(() => w.auditSelected(db, "email", rev, before)).toThrow(
      /Revision changed/,
    );
    expect(selectedDate(db, "email")).toBe(boundary);
  });
});
