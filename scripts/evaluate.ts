import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import { evaluate, MODE, verdict } from "../lib/verification";
const source = z.object({
  id: z.number(),
  fact: z.string(),
  variant: z.string(),
  wording: z.string(),
  start: z.iso.date(),
  until: z.iso.date().nullable(),
  metric: z.string(),
});
const dataset = z
  .object({
    label: z.string(),
    policy: z.string(),
    evidence: z.array(source),
    mislabelled: z.array(source),
    examples: z.array(
      z.object({
        id: z.string(),
        category: z.string(),
        draft: z.string(),
        variant: z.string(),
        publication: z.iso.date(),
        expected: verdict,
        bundle: z.enum(["catalog", "mislabelled"]),
      }),
    ),
  })
  .parse(JSON.parse(readFileSync("evaluation/watch-synthetic.json", "utf8")));
const result = dataset.examples.map((example) => {
  const evidence =
    example.bundle === "mislabelled" ? dataset.mislabelled : dataset.evidence;
  const findings = evaluate(
    example.draft,
    example.variant,
    evidence,
    example.publication,
  );
  const actual = findings.some((f) => f.verdict === "Needs manual review")
    ? "Needs manual review"
    : findings.some((f) => f.verdict === "Contradicted")
      ? "Contradicted"
      : findings.some((f) => f.verdict === "Insufficient evidence")
        ? "Insufficient evidence"
        : "Supported";
  const invalidCitations = findings.flatMap((f) =>
    f.evidence.filter((id) => {
      const v = evidence.find((v) => v.id === id);
      if (
        !v ||
        v.variant !== example.variant ||
        v.variant !== f.claim.variant ||
        v.start > example.publication ||
        (v.until !== null && v.until <= example.publication) ||
        v.metric !== f.claim.metric
      )
        return true;
      const explicit = /^aster watch (standard|trail):/i.exec(v.wording);
      return (
        !!explicit &&
        "Aster " +
          (explicit[1].toLowerCase() === "standard" ? "Standard" : "Trail") !==
          v.variant
      );
    }),
  ).length;
  const invalidSpans = findings.filter(
    (f) => example.draft.slice(f.claim.start, f.claim.stop) !== f.claim.quote,
  ).length;
  const unsupportedPasses = findings.filter(
    (f) => f.verdict === "Supported" && !f.evidence.length,
  ).length;
  return {
    ...example,
    actual,
    correct: actual === example.expected,
    invalidCitations,
    invalidSpans,
    unsupportedPasses,
    findings,
  };
});
const report = {
  datasetSha256: createHash("sha256")
    .update(readFileSync("evaluation/watch-synthetic.json"))
    .digest("hex"),
  label: dataset.label,
  policy: dataset.policy,
  mode: MODE,
  total: result.length,
  correctVerdicts: result.filter((r) => r.correct).length,
  cleanClaims: result.filter((r) => r.expected === "Supported").length,
  falseAlarmsOnCleanClaims: result.filter(
    (r) => r.expected === "Supported" && r.actual !== "Supported",
  ).length,
  issueClaims: result.filter((r) => r.expected !== "Supported").length,
  missedIssues: result.filter(
    (r) => r.expected !== "Supported" && r.actual === "Supported",
  ).length,
  invalidCitations: result.reduce((n, r) => n + r.invalidCitations, 0),
  invalidSpans: result.reduce((n, r) => n + r.invalidSpans, 0),
  unsupportedPasses: result.reduce((n, r) => n + r.unsupportedPasses, 0),
  failures: result
    .filter((r) => !r.correct)
    .map((r) => ({
      id: r.id,
      draft: r.draft,
      expected: r.expected,
      actual: r.actual,
    })),
  results: result,
};
const output = process.argv[process.argv.indexOf("--output") + 1];
if (process.argv.includes("--output") && output) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
// Conservative clean-claim failures are reported, not hidden or relabelled.
// Unsupported passes or bad citations/spans are release gates.
if (
  report.missedIssues ||
  report.invalidCitations ||
  report.invalidSpans ||
  report.unsupportedPasses
)
  process.exitCode = 1;
