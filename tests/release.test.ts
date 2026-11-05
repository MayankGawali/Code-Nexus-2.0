import { it, expect } from "vitest";
import { evaluate, type Evidence } from "../lib/verification";
const source: Evidence = {
  id: 11,
  fact: "runtime",
  variant: "Aster Standard",
  wording: "up to 19 hours in standard mode",
  start: "2026-01-01",
  until: null,
};
it("blocks explicit asset and source variant substitution even when a similar source exists", () => {
  const other = { ...source, id: 12, variant: "Aster Trail" };
  expect(
    evaluate(
      "Aster Watch Trail: up to 19 hours in standard mode",
      "Aster Standard",
      [other],
      "2027-01-01",
    )[0],
  ).toMatchObject({ verdict: "Insufficient evidence", evidence: [] });
  const corrupt = {
    ...source,
    wording: "Aster Watch Trail: up to 19 hours in standard mode",
  };
  expect(
    evaluate(source.wording, "Aster Standard", [corrupt], "2027-01-01")[0],
  ).toMatchObject({ verdict: "Needs manual review", evidence: [] });
});
it("does not turn a question into a supported statement", () => {
  const draft = "Up to 19 hours in standard mode?";
  const result = evaluate(draft, "Aster Standard", [source], "2027-01-01")[0];
  expect(result.verdict).toBe("Needs manual review");
  expect(draft.slice(result.claim.start, result.claim.stop)).toBe(
    result.claim.quote,
  );
});
it.each(["silver", "silver and black"])(
  "supports whole colour-set subsets: %s",
  (draft) => {
    expect(
      evaluate(
        draft,
        "Aster Standard",
        [{ ...source, wording: "black and silver" }],
        "2027-01-01",
      )[0].verdict,
    ).toBe("Supported");
  },
);

it("keeps an unsupported decimal quantity in one complete original span", () => {
  const draft = "Up to 19.75 hours in standard mode";
  const findings = evaluate(draft, "Aster Standard", [source], "2027-01-01");
  expect(findings).toHaveLength(1);
  expect(findings[0]).toMatchObject({
    verdict: "Needs manual review",
    claim: { quote: draft, start: 0, stop: draft.length },
  });
});

it("does not support quantities which alias after floating-point conversion", () => {
  const evidence = {
    ...source,
    wording: "up to 9007199254740992 hours in standard mode",
  };
  const draft = "up to 9007199254740993 hours in standard mode";
  expect(
    evaluate(draft, "Aster Standard", [evidence], "2027-01-01")[0],
  ).toMatchObject({ verdict: "Needs manual review", evidence: [] });
});
