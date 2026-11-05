import { createHash } from "node:crypto";
import { z } from "zod";
import { type DB, rows, insert } from "./db";
import * as m from "./models";
import { extract } from "./verification";

export const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function selectedDate(db: DB, asset: string) {
  const selected = db
    .prepare(
      "SELECT day FROM publication_selection WHERE asset=? ORDER BY id DESC LIMIT 1",
    )
    .get(asset);
  if (selected) return m.date.parse(selected.day);
  return rows(
    db,
    m.campaign,
    "SELECT c.* FROM campaign c JOIN asset a ON a.campaign=c.id WHERE a.id=?",
    asset,
  )[0].publication;
}
export const evidenceFor = (db: DB, variant: string, day: string) =>
  rows(
    db,
    m.version.extend({ variant: z.string() }),
    "SELECT p.*, f.variant FROM periods p JOIN fact f ON f.id=p.fact WHERE f.variant=? AND p.start<=? AND (p.until IS NULL OR p.until>?) ORDER BY p.id",
    variant,
    day,
    day,
  );
export function evidenceFingerprint(
  body: string,
  variant: string,
  day: string,
  evidence: ReturnType<typeof evidenceFor>,
) {
  const metrics = new Set(extract(body, variant).map((c) => c.metric));
  return hash(
    evidence
      .filter(
        (e) =>
          metrics.has("unknown") ||
          metrics.has(extract(e.wording, e.variant)[0].metric) ||
          extract(e.wording, e.variant)[0].metric === "unknown",
      )
      .map((e) => [e.id, e.fact, e.variant, e.wording])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
}
export function currentFingerprint(db: DB, run: number) {
  const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  if (!a) throw Error("Audit not found.");
  const r = rows(
    db,
    m.revision,
    "SELECT * FROM revision WHERE id=?",
    a.revision,
  )[0];
  const asset = rows(db, m.asset, "SELECT * FROM asset WHERE id=?", r.asset)[0];
  return evidenceFingerprint(
    r.body,
    asset.variant,
    a.publication,
    evidenceFor(db, asset.variant, a.publication),
  );
}
export function freshAudit(db: DB, run: number) {
  const saved = db
    .prepare("SELECT fingerprint FROM audit_context WHERE audit=?")
    .get(run);
  if (saved) return saved.fingerprint === currentFingerprint(db, run);
  // Legacy audits have no full snapshot. Compare their immutable dependency set
  // conservatively; newly added relevant evidence requires another review.
  const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  if (!a) throw Error("Audit not found.");
  const revision = rows(
    db,
    m.revision,
    "SELECT * FROM revision WHERE id=?",
    a.revision,
  )[0];
  const asset = rows(
    db,
    m.asset,
    "SELECT * FROM asset WHERE id=?",
    revision.asset,
  )[0];
  const linked = rows(
    db,
    m.version.extend({ variant: z.string() }),
    "SELECT DISTINCT p.*, f.variant FROM periods p JOIN fact f ON f.id=p.fact JOIN evidence e ON e.version=p.id JOIN finding c ON c.id=e.finding WHERE c.audit=?",
    run,
  );
  return (
    evidenceFingerprint(revision.body, asset.variant, a.publication, linked) ===
    currentFingerprint(db, run)
  );
}
// Call inside the same BEGIN IMMEDIATE transaction as the mutation.
// Reusing a request token with different data is always an error.
export function once(
  db: DB,
  key: string | undefined,
  payload: unknown,
  work: () => number,
) {
  if (!key) return work();
  z.string().min(1).max(200).parse(key);
  const encoded = JSON.stringify(payload);
  const previous = db
    .prepare("SELECT payload,result FROM operation WHERE key=?")
    .get(key);
  if (previous) {
    if (previous.payload !== encoded)
      throw Error("Request token was already used with different data.");
    return z.number().parse(previous.result);
  }
  const result = work();
  insert(db, "INSERT INTO operation VALUES(?,?,?)", key, encoded, result);
  return result;
}
