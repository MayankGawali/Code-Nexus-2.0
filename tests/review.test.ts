import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { connect, migrate, type DB } from "../lib/db";
import { seed } from "../lib/seed";
import * as r from "../lib/review";
describe("dated evidence and review decisions", () => {
  let db: DB;
  beforeEach(() => {
    db = connect(":memory:");
    migrate(db);
    seed(db);
  });
  afterEach(() => db.close());
  it("seeds twice without duplicating any entity, including decisions and links", () => {
    const counts = () =>
      [
        "campaign",
        "asset",
        "revision",
        "fact",
        "version",
        "audit",
        "finding",
        "evidence",
        "decision",
      ].map((t) => db.prepare("SELECT count(*) AS n FROM " + t).get()?.n);
    expect(counts()).toEqual([1, 3, 3, 3, 3, 3, 3, 3, 3]);
    migrate(db);
    seed(db);
    expect(counts()).toEqual([1, 3, 3, 3, 3, 3, 3, 3, 3]);
  });
  it("uses half-open dates, retaining exact prior evidence and selective impact", () => {
    const old = r.versions(db, "battery")[0],
      rev = r.revisions(db, "product")[0],
      original = r.decisions(db, "product")[0];
    r.transition(
      db,
      "battery",
      old.id,
      "up to 18 hours in standard mode",
      "2026-11-20",
    );
    const before = r.auditRevision(db, rev.id, "2026-11-19"),
      at = r.auditRevision(db, rev.id, "2026-11-20");
    expect(r.currentEvidence(db, before)).toBe(true);
    expect(r.currentEvidence(db, at)).toBe(false);
    expect(
      ["product", "email", "poster"].map((id) => r.status(db, id)),
    ).toEqual(["Needs review", "Needs review", "Approved"]);
    expect(r.decisions(db, "product")).toEqual([original]);
    expect(
      r.sources(db, r.findings(db, original.audit)[0].id)[0],
    ).toMatchObject({ id: old.id, wording: old.wording, until: "2026-11-20" });
    expect(() => r.approve(db, at)).toThrow();
    r.approve(db, before);
    expect(r.status(db, "product", "2026-11-19")).toBe("Approved");
    expect(r.status(db, "product")).toBe("Needs review");
    const corrected = r.revise(
      db,
      "product",
      rev.id,
      "up to 18 hours in standard mode.",
    );
    const rerun = r.auditRevision(db, corrected, "2026-11-20");
    r.approve(db, rerun);
    expect(r.status(db, "product")).toBe("Approved");
    expect(r.decisions(db, "product")).toHaveLength(3);
  });
  it("rejects overlap, invalid dates and partial transitions; accepts adjacent intervals", () => {
    expect(() =>
      r.addVersion(db, "battery", "duplicate", "2026-08-01"),
    ).toThrow(/Overlapping/);
    expect(() => r.addVersion(db, "battery", "bad", "2026-02-30")).toThrow();
    const old = r.versions(db, "battery")[0];
    expect(() =>
      r.transition(db, "battery", old.id, "", "2026-11-20"),
    ).toThrow();
    expect(r.versions(db, "battery")).toEqual([old]);
    r.addVersion(db, "battery", "earlier", "2025-11-01", "2026-01-01");
    expect(() =>
      r.addVersion(db, "battery", "overlap", "2025-10-01", "2025-11-02"),
    ).toThrow(/Overlapping/);
  });
  it("does not retrieve GPS evidence from another variant or approve partial matches", () => {
    const body = "  BLACK AND SILVER. dual-band GPS. not black and silver.";
    const id = r.revise(db, "poster", r.revisions(db, "poster")[0].id, body);
    const run = r.auditRevision(db, id, "2026-11-20"),
      claims = r.findings(db, run);
    expect(claims.map((f) => f.supported)).toEqual([1, 0, 0]);
    const saved = r.revisions(db, "poster")[0].body;
    for (const f of claims) expect(saved.slice(f.start, f.stop)).toBe(f.quote);
    expect(r.sources(db, claims[1].id)).toEqual([]);
    expect(() => r.approve(db, run)).toThrow();
  });
  it("protects immutable records, rejects obsolete edits and approvals", () => {
    const rev = r.revisions(db, "product")[0],
      run = r.auditRevision(db, rev.id, "2026-07-01");
    r.revise(db, "product", rev.id, "black and silver");
    expect(() => r.approve(db, run)).toThrow();
    expect(() => r.revise(db, "product", rev.id, "overwrite")).toThrow(
      /changed/,
    );
    for (const table of ["revision", "version", "decision"])
      expect(() => db.exec("DELETE FROM " + table)).toThrow(/Immutable/);
  });
});
