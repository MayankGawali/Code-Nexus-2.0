import { z } from "zod";
import { type DB, rows, insert } from "./db";
import { checkContrast, posterStyleSchema } from "./contrast";
export function posterStyle(db: DB, revision: number) {
  return rows(
    db,
    posterStyleSchema,
    "SELECT foreground,background,kind FROM poster_style WHERE revision=?",
    revision,
  )[0];
}
export const visualFindings = (db: DB, audit: number) =>
  rows(
    db,
    z.object({
      id: z.number(),
      audit: z.number(),
      element: z.string(),
      foreground: z.string(),
      background: z.string(),
      kind: z.string(),
      ratio: z.number().nullable(),
      verdict: z.string(),
      explanation: z.string(),
      mode: z.string(),
    }),
    "SELECT * FROM visual_finding WHERE audit=?",
    audit,
  );
export function recordVisual(db: DB, audit: number, revision: number) {
  const print = !!db
    .prepare(
      "SELECT 1 FROM revision r JOIN asset a ON a.id=r.asset WHERE r.id=? AND a.channel='Print'",
    )
    .get(revision);
  if (!print) return;
  const style = posterStyle(db, revision),
    result = checkContrast(style);
  insert(
    db,
    "INSERT INTO visual_finding(audit,element,foreground,background,kind,ratio,verdict,explanation) VALUES(?,?,?,?,?,?,?,?)",
    audit,
    "poster-cta",
    style?.foreground ?? "",
    style?.background ?? "",
    style?.kind ?? "unsupported",
    result.ratio,
    result.verdict,
    result.explanation,
  );
}
export function visualReady(db: DB, audit: number) {
  const print = !!db
    .prepare(
      "SELECT 1 FROM audit t JOIN revision r ON r.id=t.revision JOIN asset a ON a.id=r.asset WHERE t.id=? AND a.channel='Print'",
    )
    .get(audit);
  return (
    !print || visualFindings(db, audit).some((v) => v.verdict === "Supported")
  );
}
