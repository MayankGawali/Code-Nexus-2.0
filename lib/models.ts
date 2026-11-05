import { z } from "zod";
export const date = z.iso.date();
const s = z.string(),
  n = z.number().int();
export const campaign = z.object({ id: s, name: s, publication: date });
export const asset = z.object({
  id: s,
  name: s,
  campaign: s,
  variant: s,
  channel: s,
});
export const revision = z.object({ id: n, asset: s, body: s });
export const fact = z.object({ id: s, variant: s, label: s });
export const version = z.object({
  id: n,
  fact: s,
  wording: s,
  start: date,
  until: date.nullable(),
});
export const audit = z.object({ id: n, revision: n, publication: date });
export const finding = z.object({
  id: n,
  audit: n,
  start: n,
  stop: n,
  quote: s,
  supported: n,
});
export const evidence = z.object({ finding: n, version: n });
export const decision = z.object({
  id: n,
  audit: n,
  outcome: z.literal("Approved"),
  created: s,
});
export const copy = z.string().trim().min(1).max(4000);
export const wording = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^[^.!?\r\n]+$/, "Use one claim without sentence punctuation.");
export const active = (v: z.infer<typeof version>, day: string) =>
  v.start <= day && (!v.until || day < v.until);

export type Campaign = z.infer<typeof campaign>;
export type Asset = z.infer<typeof asset>;
export type AssetRevision = z.infer<typeof revision>;
export type Fact = z.infer<typeof fact>;
export type FactVersion = z.infer<typeof version>;
export type AuditRun = z.infer<typeof audit>;
export type Finding = z.infer<typeof finding>;
export type ClaimEvidenceLink = z.infer<typeof evidence>;
export type ReviewDecision = z.infer<typeof decision>;
