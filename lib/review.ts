import { randomUUID } from "node:crypto";
import { z } from "zod";
import { type DB, insert, rows, transaction } from "./db";
import * as m from "./models";
import { posterStyle, recordVisual, visualReady } from "./visual";
import { posterStyleSchema, type PosterStyle } from "./contrast";
import { evaluate, MODE } from "./verification";
import {
  evidenceFor,
  currentFingerprint,
  freshAudit,
  selectedDate,
  once,
} from "./context";

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
export function addCampaign(
  db: DB,
  id: string,
  name: string,
  publication: string,
) {
  const slug = z
    .string()
    .trim()
    .regex(/^[\w-]+$/, "Use alphanumeric characters or hyphens.")
    .parse(id);
  const title = z.string().trim().min(1).max(120).parse(name);
  const dateStr = m.date.parse(publication);
  return transaction(db, () => {
    insert(db, "INSERT INTO campaign VALUES(?,?,?)", slug, title, dateStr);
    return slug;
  });
}

export function addAsset(
  db: DB,
  id: string,
  campaign: string,
  name: string,
  channel: string,
  variant: string,
  body: string,
  style?: PosterStyle,
) {
  const slug = z
    .string()
    .trim()
    .regex(/^[\w-]+$/, "Use alphanumeric characters or hyphens.")
    .parse(id);
  const title = z.string().trim().min(1).max(120).parse(name);
  const cChannel = z
    .enum(["Web", "Email", "Print", "Social", "Document"])
    .catch("Web")
    .parse(channel);
  const cVariant = z.string().trim().min(1).max(120).parse(variant);
  const initialCopy = m.copy.parse(body);

  return transaction(db, () => {
    insert(
      db,
      "INSERT INTO asset VALUES(?,?,?,?,?)",
      slug,
      campaign,
      title,
      cVariant,
      cChannel,
    );
    const revId = insert(
      db,
      "INSERT INTO revision(asset,body) VALUES(?,?)",
      slug,
      initialCopy,
    );
    if (cChannel === "Print") {
      insert(
        db,
        "INSERT INTO poster_style VALUES(?,?,?,?)",
        revId,
        style?.foreground ?? "#ffffff",
        style?.background ?? "#173b34",
        style?.kind ?? "solid",
      );
    }
    const c = rows(
      db,
      m.campaign,
      "SELECT * FROM campaign WHERE id=?",
      campaign,
    )[0];
    const pubDate = c ? c.publication : new Date().toISOString().slice(0, 10);
    recordAudit(db, revId, pubDate);
    return slug;
  });
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
  return transaction(db, () => recordTransition(db, id, expected, word, start));
}
export function recordTransition(
  db: DB,
  id: string,
  expected: number,
  word: string,
  start: string,
) {
  const latest = versions(db, id)[0];
  if (!latest || latest.id !== expected || latest.until)
    throw Error("Fact changed. Reload its latest version.");
  if (m.date.parse(start) <= latest.start)
    throw Error("New version must start after the previous version.");
  insert(db, "INSERT INTO closure VALUES(?,?)", expected, start);
  return addVersion(db, id, word, start);
}
export function revise(
  db: DB,
  asset: string,
  expected: number,
  body: string,
  key?: string,
) {
  return transaction(db, () =>
    once(db, key, ["revision", asset, expected, body], () =>
      recordRevision(db, asset, expected, body),
    ),
  );
}
export function recordRevision(
  db: DB,
  asset: string,
  expected: number,
  body: string,
  style?: PosterStyle,
) {
  if (revisions(db, asset)[0]?.id !== expected)
    throw Error("Revision changed. Reload before editing.");
  const id = insert(
    db,
    "INSERT INTO revision(asset,body) VALUES(?,?)",
    asset,
    m.copy.parse(body),
  );
  const visual = style ?? posterStyle(db, expected);
  if (visual)
    insert(
      db,
      "INSERT INTO poster_style VALUES(?,?,?,?)",
      id,
      visual.foreground,
      visual.background,
      visual.kind,
    );
  return id;
}
// Persist all verdicts, including supported links and blocking manual outcomes.
export function auditRevision(db: DB, id: number, day: string) {
  return transaction(db, () => recordAudit(db, id, day));
}
export function recordAudit(db: DB, id: number, day: string) {
  m.date.parse(day);
  const rev = rows(db, m.revision, "SELECT * FROM revision WHERE id=?", id)[0];
  if (!rev) throw Error("Revision not found.");
  const asset = rows(
    db,
    m.asset,
    "SELECT * FROM asset WHERE id=?",
    rev.asset,
  )[0];
  const evidence = evidenceFor(db, asset.variant, day);
  const results = evaluate(rev.body, asset.variant, evidence, day);
  const run = insert(
    db,
    "INSERT INTO audit(revision,publication,mode) VALUES(?,?,?)",
    id,
    day,
    MODE,
  );
  for (const r of results) {
    const c = r.claim;
    const f = insert(
      db,
      "INSERT INTO finding(audit,start,stop,quote,supported,verdict,explanation,suggestion,extracted) VALUES(?,?,?,?,?,?,?,?,?)",
      run,
      c.start,
      c.stop,
      c.quote,
      Number(r.verdict === "Supported"),
      r.verdict,
      r.explanation,
      r.suggestion,
      JSON.stringify(c),
    );
    for (const version of r.evidence)
      insert(db, "INSERT INTO evidence VALUES(?,?)", f, version);
  }
  insert(
    db,
    "INSERT INTO audit_context VALUES(?,?)",
    run,
    currentFingerprint(db, run),
  );
  recordVisual(db, run, id);
  return run;
}
export function currentEvidence(db: DB, run: number) {
  const audit = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  if (!audit) throw Error("Audit not found.");
  const claims = findings(db, run);
  return (
    visualReady(db, run) &&
    freshAudit(db, run) &&
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
  const existing = rows(
    db,
    m.decision,
    "SELECT * FROM decision WHERE audit=?",
    run,
  )[0];
  if (existing) return existing.id;
  const rev = rows(
    db,
    m.revision,
    "SELECT r.* FROM revision r JOIN audit a ON a.revision=r.id WHERE a.id=?",
    run,
  )[0];
  if (!rev) throw Error("Audit revision not found.");
  if (revisions(db, rev.asset)[0]?.id !== rev.id)
    throw Error(
      "Revision changed. Reload the current revision before approving; the captured audit remains in history.",
    );
  if (!resolvedAudit(db, run))
    throw Error(
      "Approval requires fresh evidence and resolved or explicitly overridden checks.",
    );
  return insert(
    db,
    "INSERT INTO decision(audit,outcome) VALUES(?,'Approved')",
    run,
  );
}
export function status(db: DB, id: string, day?: string) {
  const rev = revisions(db, id)[0];
  const planned = day ?? selectedDate(db, id);
  const datedRuns = new Set(
    audits(db, rev.id)
      .filter((a) => a.publication === planned)
      .map((a) => a.id),
  );
  const approval = decisions(db, id).find((d) => datedRuns.has(d.audit));
  return !approval
    ? "In review"
    : resolvedAudit(db, approval.audit)
      ? "Approved"
      : "Needs review";
}

export const overrides = (db: DB, run: number) =>
  rows(
    db,
    z.object({
      id: z.number(),
      finding: z.number(),
      revision: z.number(),
      audit: z.number(),
      context: z.string(),
      reason: z.string(),
      created: z.string(),
    }),
    "SELECT * FROM finding_override WHERE audit=? ORDER BY id",
    run,
  );
export function resolvedAudit(db: DB, run: number) {
  if (!freshAudit(db, run) || !visualReady(db, run)) return false;
  const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  const claims = findings(db, run),
    exceptions = overrides(db, run),
    fingerprint = currentFingerprint(db, run);
  return (
    claims.length > 0 &&
    claims.every((f) =>
      f.supported
        ? sources(db, f.id).some((v) => m.active(v, a.publication))
        : exceptions.some(
            (o) =>
              o.finding === f.id &&
              o.revision === a.revision &&
              o.context === fingerprint,
          ),
    )
  );
}
export function overrideFinding(
  db: DB,
  id: number,
  reason: string,
  key?: string,
) {
  return transaction(db, () =>
    once(db, key, ["override", id, reason], () => {
      const f = rows(db, m.finding, "SELECT * FROM finding WHERE id=?", id)[0];
      if (!f || f.supported)
        throw Error("Only an unresolved finding can be overridden.");
      const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", f.audit)[0];
      const r = rows(
        db,
        m.revision,
        "SELECT * FROM revision WHERE id=?",
        a.revision,
      )[0];
      if (
        revisions(db, r.asset)[0].id !== r.id ||
        !freshAudit(db, a.id) ||
        !db.prepare("SELECT 1 FROM audit_context WHERE audit=?").get(a.id)
      )
        throw Error(
          "Audit is stale. Re-audit the current revision before overriding.",
        );
      const explanation = z.string().trim().min(3).max(1000).parse(reason);
      const old = overrides(db, a.id).find((o) => o.finding === id);
      if (old) {
        if (old.reason !== explanation)
          throw Error("Finding already overridden with a different reason.");
        return old.id;
      }
      return insert(
        db,
        "INSERT INTO finding_override(finding,revision,audit,context,reason) VALUES(?,?,?,?,?)",
        id,
        r.id,
        a.id,
        currentFingerprint(db, a.id),
        explanation,
      );
    }),
  );
}
export function acceptSuggestion(
  db: DB,
  id: number,
  expected: number,
  key?: string,
) {
  return transaction(db, () =>
    once(db, key, ["accept", id, expected], () => {
      const f = rows(db, m.finding, "SELECT * FROM finding WHERE id=?", id)[0];
      if (!f?.suggestion) throw Error("No proposed correction.");
      const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", f.audit)[0];
      const r = rows(
        db,
        m.revision,
        "SELECT * FROM revision WHERE id=?",
        a.revision,
      )[0];
      if (a.revision !== expected || !freshAudit(db, a.id))
        throw Error("Suggestion is stale. Re-audit before accepting.");
      return recordRevision(
        db,
        r.asset,
        expected,
        r.body.slice(0, f.start) + f.suggestion + r.body.slice(f.stop),
      );
    }),
  );
}
export function compareRevision(db: DB, run: number) {
  const a = rows(db, m.audit, "SELECT * FROM audit WHERE id=?", run)[0];
  const r = rows(
    db,
    m.revision,
    "SELECT * FROM revision WHERE id=?",
    a.revision,
  )[0];
  const previous = revisions(db, r.asset).find((v) => v.id < r.id);
  const baseline =
    previous &&
    audits(db, previous.id).find((v) => v.publication === a.publication);
  const before = baseline ? findings(db, baseline.id) : [],
    after = findings(db, run);
  return {
    previous: previous?.id ?? null,
    baseline: baseline?.id ?? null,
    changes: Array.from(
      { length: Math.max(before.length, after.length) },
      (_, i) => ({
        position: i + 1,
        before: before[i] ?? null,
        after: after[i] ?? null,
      }),
    ),
  };
}

export function revisePoster(
  db: DB,
  asset: string,
  expected: number,
  input: PosterStyle,
  key?: string,
) {
  return transaction(db, () =>
    once(db, key, ["poster", asset, expected, input], () => {
      const style = posterStyleSchema.parse(input);
      if (
        !db
          .prepare("SELECT 1 FROM asset WHERE id=? AND channel='Print'")
          .get(asset)
      )
        throw Error("This asset does not use the poster template.");
      const current = revisions(db, asset)[0];
      const revision = recordRevision(db, asset, expected, current.body, style);
      recordAudit(db, revision, selectedDate(db, asset));
      return revision;
    }),
  );
}
