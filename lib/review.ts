import { randomUUID } from "node:crypto";
import { z } from "zod";
import { type DB, insert, rows, transaction } from "./db";
import * as m from "./models";

export const campaigns = (db: DB) =>
  rows(db, m.campaign, "SELECT * FROM campaign ORDER BY name");
export const assets = (db: DB, id: string) =>
  rows(db, m.asset, "SELECT * FROM asset WHERE campaign=? ORDER BY rowid", id);
export const facts = (db: DB) =>
  rows(db, m.fact, "SELECT * FROM fact ORDER BY rowid");
export const versions = (db: DB, id: string) =>
  rows(
    db,
    m.version,
    "SELECT * FROM periods WHERE fact=? ORDER BY start DESC",
    id,
  );
export const revisions = (db: DB, id: string) =>
  rows(
    db,
    m.revision,
    "SELECT * FROM revision WHERE asset=? ORDER BY id DESC",
    id,
  );
export const audits = (db: DB, id: number) =>
  rows(
    db,
    m.audit,
    "SELECT * FROM audit WHERE revision=? ORDER BY id DESC",
    id,
  );
export const findings = (db: DB, id: number) =>
  rows(db, m.finding, "SELECT * FROM finding WHERE audit=? ORDER BY start", id);
export const sources = (db: DB, id: number) =>
  rows(
    db,
    m.version,
    "SELECT p.* FROM evidence e JOIN periods p ON e.version=p.id WHERE e.finding=?",
    id,
  );
export const decisions = (db: DB, id: string) =>
  rows(
    db,
    m.decision,
    "SELECT d.* FROM decision d JOIN audit a ON a.id=d.audit JOIN revision r ON r.id=a.revision WHERE r.asset=? ORDER BY d.id DESC",
    id,
  );

export function addVersion(
  db: DB,
  id: string,
  word: string,
  start: string,
  until: string | null = null,
) {
  const end = m.date.nullable().parse(until),
    from = m.date.parse(start);
  if (end && from >= end) throw Error("End must follow start.");
  return insert(
    db,
    "INSERT INTO version(fact,wording,start,until) VALUES(?,?,?,?)",
    id,
    m.wording.parse(word),
    from,
    end,
  );
}
export function addFact(
  db: DB,
  variant: string,
  label: string,
  word: string,
  start: string,
) {
  return transaction(db, () => {
    const id = randomUUID(),
      field = z.string().trim().min(1).max(80);
    insert(
      db,
      "INSERT INTO fact VALUES(?,?,?)",
      id,
      field.parse(variant),
      field.parse(label),
    );
    addVersion(db, id, word, start);
    return id;
  });
}
export function transition(
  db: DB,
  id: string,
  expected: number,
  word: string,
  start: string,
) {
  return transaction(db, () => {
    const latest = versions(db, id)[0];
    if (!latest || latest.id !== expected || latest.until)
      throw Error("Fact changed. Reload its latest version.");
    if (m.date.parse(start) <= latest.start)
      throw Error("New version must start after the previous version.");
    insert(db, "INSERT INTO closure VALUES(?,?)", expected, start);
    return addVersion(db, id, word, start);
  });
}
export function revise(db: DB, asset: string, expected: number, body: string) {
  return transaction(db, () => {
    if (revisions(db, asset)[0]?.id !== expected)
      throw Error("Revision changed. Reload before editing.");
    return insert(
      db,
      "INSERT INTO revision(asset,body) VALUES(?,?)",
      asset,
      m.copy.parse(body),
    );
  });
}
// Each nonempty sentence/line is a complete claim. Partial matches, negation
// and unrecognised prose cannot silently pass as supported claims.
export function auditRevision(db: DB, id: number, day: string) {
  return transaction(db, () => recordAudit(db, id, day));
}
export function recordAudit(db: DB, id: number, day: string) {
  m.date.parse(day);
  const rev = rows(db, m.revision, "SELECT * FROM revision WHERE id=?", id)[0];
  if (!rev) throw Error("Revision not found.");
  const candidates = rows(
    db,
    m.version,
    `SELECT p.* FROM periods p JOIN fact f ON f.id=p.fact JOIN asset a ON a.variant=f.variant
    WHERE a.id=? AND p.start<=? AND (p.until IS NULL OR p.until>?) ORDER BY p.id`,
    rev.asset,
    day,
    day,
  );
  const run = insert(
    db,
    "INSERT INTO audit(revision,publication) VALUES(?,?)",
    id,
    day,
  );
  for (const match of rev.body.matchAll(/[^.!?\n\r]+/g)) {
    const quote = match[0].trim();
    if (!quote) continue;
    const start = match.index! + match[0].indexOf(quote);
    const source = candidates.find(
      (v) => v.wording.toLowerCase() === quote.toLowerCase(),
    );
    const f = insert(
      db,
      "INSERT INTO finding(audit,start,stop,quote,supported) VALUES(?,?,?,?,?)",
      run,
      start,
      start + quote.length,
      quote,
      Number(!!source),
    );
    if (source) insert(db, "INSERT INTO evidence VALUES(?,?)", f, source.id);
  }
  return run;
}
export function currentEvidence(db: DB, run: number) {
  const audit = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  if (!audit) throw Error("Audit not found.");
  const claims = findings(db, run);
  return (
    claims.length > 0 &&
    claims.every(
      (f) =>
        f.supported &&
        sources(db, f.id).some((v) => m.active(v, audit.publication)),
    )
  );
}
export function approve(db: DB, run: number) {
  return transaction(db, () => recordApproval(db, run));
}
export function recordApproval(db: DB, run: number) {
  const rev = rows(
    db,
    m.revision,
    "SELECT r.* FROM revision r JOIN audit a ON a.revision=r.id WHERE a.id=?",
    run,
  )[0];
  if (
    !rev ||
    revisions(db, rev.asset)[0]?.id !== rev.id ||
    !currentEvidence(db, run)
  )
    throw Error(
      "Approval requires the current revision and supported, current evidence.",
    );
  return insert(
    db,
    "INSERT INTO decision(audit,outcome) VALUES(?,'Approved')",
    run,
  );
}
export function status(db: DB, id: string, day?: string) {
  const rev = revisions(db, id)[0];
  const planned =
    day ??
    rows(
      db,
      m.campaign,
      "SELECT c.* FROM campaign c JOIN asset a ON a.campaign=c.id WHERE a.id=?",
      id,
    )[0].publication;
  const datedRuns = new Set(
    audits(db, rev.id)
      .filter((a) => a.publication === planned)
      .map((a) => a.id),
  );
  const approval = decisions(db, id).find((d) => datedRuns.has(d.audit));
  return !approval
    ? "In review"
    : currentEvidence(db, approval.audit)
      ? "Approved"
      : "Needs review";
}
