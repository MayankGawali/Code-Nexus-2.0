import { randomUUID } from "node:crypto";
import { z } from "zod";
import { type DB, rows, insert, transaction } from "./db";
import * as m from "./models";
import * as r from "./review";
import { evaluate, extract } from "./verification";
import {
  hash,
  evidenceFor,
  evidenceFingerprint,
  selectedDate,
  once,
} from "./context";

const impactSchema = z.object({
  asset: z.string(),
  name: z.string(),
  revision: z.number(),
  publication: m.date,
  dependency: z.boolean(),
  changed: z.boolean(),
  before: z.array(z.string()),
  after: z.array(z.string()),
});
const previewSchema = z.object({
  id: z.string(),
  fact: z.string(),
  expected: z.number(),
  wording: z.string(),
  start: m.date,
  quote: z.string(),
  reason: z.string(),
  snapshot: z.string(),
  impact: z.preprocess(
    (v) => (typeof v === "string" ? JSON.parse(v) : v),
    z.array(impactSchema),
  ),
  created: z.string(),
});
const creationSchema = previewSchema
  .omit({ fact: true, expected: true })
  .extend({ variant: z.string(), label: z.string() });
export function previews(db: DB, id: string) {
  const version = rows(
    db,
    previewSchema,
    "SELECT * FROM change_preview WHERE id=?",
    id,
  )[0];
  if (version) return { ...version, kind: "version" as const };
  const fact = rows(
    db,
    creationSchema,
    "SELECT * FROM fact_creation_preview WHERE id=?",
    id,
  )[0];
  return fact ? { ...fact, kind: "fact" as const } : undefined;
}
export const provenance = (db: DB, id: number) =>
  rows(
    db,
    z.object({
      version: z.number(),
      quote: z.string(),
      reason: z.string(),
      created: z.string(),
    }),
    "SELECT * FROM source_change WHERE version=?",
    id,
  )[0];
export const history = (db: DB) =>
  rows(
    db,
    z.object({
      id: z.number(),
      kind: z.string(),
      entity: z.number(),
      detail: z.string(),
      created: z.string(),
      imported: z.number(),
      actor: z.string(),
    }),
    "SELECT h.id,h.kind,h.entity,CASE WHEN h.kind='visual check' AND v.id IS NOT NULL THEN 'Poster CTA for audit #'||v.audit||': '||coalesce(round(v.ratio,2)||':1','unmeasurable')||' - '||v.verdict||' ('||v.mode||')' ELSE h.detail END AS detail,h.created,h.imported,h.actor FROM history h LEFT JOIN visual_finding v ON h.kind='visual check' AND v.id=h.entity ORDER BY h.id",
  );
function snapshot(db: DB) {
  return hash(
    [
      "periods",
      "fact",
      "revision",
      "audit",
      "evidence",
      "decision",
      "finding_override",
      "publication_selection",
      "poster_style",
    ].map((t) => db.prepare("SELECT * FROM " + t).all()),
  );
}
function calculateImpact(
  db: DB,
  variant: string,
  id: string | null,
  expected: number | null,
  word: string,
  start: string,
) {
  const metric = extract(word, variant)[0].metric;
  const impacts: z.infer<typeof impactSchema>[] = [];
  for (const a of rows(
    db,
    m.asset,
    "SELECT * FROM asset WHERE variant=? ORDER BY id",
    variant,
  )) {
    const revision = r.revisions(db, a.id)[0];
    if (!revision) continue;
    const day = selectedDate(db, a.id);
    const dependency = !!db
      .prepare(
        `SELECT 1 FROM finding f JOIN audit a ON a.id=f.audit JOIN evidence e ON e.finding=f.id JOIN version v ON v.id=e.version
     WHERE a.revision=? AND a.publication=? AND f.supported=1 AND v.fact=? LIMIT 1`,
      )
      .get(revision.id, day, id);
    const metrics = extract(revision.body, a.variant).map((c) => c.metric);
    // Also re-examine unresolved same-product/metric assertions even without a link.
    if (
      !dependency &&
      !metrics.includes(metric) &&
      !metrics.includes("unknown") &&
      metric !== "unknown"
    )
      continue;
    const before = evidenceFor(db, a.variant, day);
    const after = before.filter((v) => v.id !== expected || day < start);
    if (day >= start)
      after.push({
        fact: id ?? "new-fact-preview",
        id: -1,
        wording: word,
        start,
        until: null,
        variant: a.variant,
      });
    const changed =
      evidenceFingerprint(revision.body, a.variant, day, before) !==
      evidenceFingerprint(revision.body, a.variant, day, after);
    impacts.push({
      asset: a.id,
      name: a.name,
      revision: revision.id,
      publication: day,
      dependency,
      changed,
      before: evaluate(revision.body, a.variant, before, day).map(
        (v) => v.verdict,
      ),
      after: evaluate(revision.body, a.variant, after, day).map(
        (v) => v.verdict,
      ),
    });
  }
  return impacts;
}
export function impactPreview(
  db: DB,
  id: string,
  expected: number,
  word: string,
  start: string,
  quote: string,
  reason: string,
) {
  return transaction(db, () => {
    m.wording.parse(word);
    m.date.parse(start);
    const source = z.string().trim().min(1).max(2000).parse(quote);
    const explanation = z.string().trim().min(3).max(1000).parse(reason);
    const latest = r.versions(db, id)[0];
    if (
      !latest ||
      latest.id !== expected ||
      latest.until ||
      start <= latest.start
    )
      throw Error(
        "Fact changed or invalid boundary. Reload the latest version.",
      );
    const fact = r.facts(db).find((f) => f.id === id)!;
    const impacts = calculateImpact(
      db,
      fact.variant,
      id,
      expected,
      word,
      start,
    );
    const token = randomUUID();
    insert(
      db,
      "INSERT INTO change_preview(id,fact,expected,wording,start,quote,reason,snapshot,impact) VALUES(?,?,?,?,?,?,?,?,?)",
      token,
      id,
      expected,
      word,
      start,
      source,
      explanation,
      snapshot(db),
      JSON.stringify(impacts),
    );
    return token;
  });
}
export function newFactPreview(
  db: DB,
  variant: string,
  label: string,
  word: string,
  start: string,
  quote: string,
  reason: string,
) {
  return transaction(db, () => {
    const field = z.string().trim().min(1).max(80);
    const scope = field.parse(variant),
      name = field.parse(label),
      wording = m.wording.parse(word);
    m.date.parse(start);
    const source = z.string().trim().min(1).max(2000).parse(quote);
    const explanation = z.string().trim().min(3).max(1000).parse(reason);
    if (r.facts(db).some((f) => f.variant === scope && f.label === name))
      throw Error(
        "That fact already exists. Add a version to its existing record.",
      );
    const impacts = calculateImpact(db, scope, null, null, wording, start),
      token = randomUUID();
    insert(
      db,
      "INSERT INTO fact_creation_preview(id,variant,label,wording,start,quote,reason,snapshot,impact) VALUES(?,?,?,?,?,?,?,?,?)",
      token,
      scope,
      name,
      wording,
      start,
      source,
      explanation,
      snapshot(db),
      JSON.stringify(impacts),
    );
    return token;
  });
}
export function publishPreview(db: DB, token: string) {
  return transaction(db, () =>
    once(db, "publish:" + token, ["publish", token], () => {
      const p = previews(db, token);
      if (!p) throw Error("Preview not found.");
      if (p.snapshot !== snapshot(db))
        throw Error(
          "Workspace changed since preview. Generate a fresh impact preview.",
        );
      let version: number;
      if (p.kind === "version")
        version = r.recordTransition(
          db,
          p.fact,
          p.expected,
          p.wording,
          p.start,
        );
      else {
        const fact = randomUUID();
        insert(db, "INSERT INTO fact VALUES(?,?,?)", fact, p.variant, p.label);
        version = r.addVersion(db, fact, p.wording, p.start);
      }
      insert(
        db,
        "INSERT INTO source_change(version,quote,reason) VALUES(?,?,?)",
        version,
        p.quote,
        p.reason,
      );
      for (const a of p.impact.filter((a) => a.changed))
        r.recordAudit(db, a.revision, a.publication);
      return version;
    }),
  );
}
export function auditSelected(
  db: DB,
  asset: string,
  expected: number,
  day: string,
  key?: string,
) {
  return transaction(db, () =>
    once(db, key, ["audit", asset, expected, day], () => {
      m.date.parse(day);
      if (r.revisions(db, asset)[0]?.id !== expected)
        throw Error("Revision changed. Reload before auditing.");
      if (selectedDate(db, asset) !== day)
        insert(
          db,
          "INSERT INTO publication_selection(asset,day) VALUES(?,?)",
          asset,
          day,
        );
      return r.recordAudit(db, expected, day);
    }),
  );
}
