import { z } from "zod";
export const MODE = "local-watch-v2";
export const verdict = z.enum([
  "Supported",
  "Contradicted",
  "Insufficient evidence",
  "Needs manual review",
]);
export const claim = z.object({
  quote: z.string(),
  start: z.number().int().nonnegative(),
  stop: z.number().int().nonnegative(),
  product: z.string().nullable(),
  variant: z.string(),
  metric: z.enum(["battery_life", "colours", "gps", "unknown"]),
  quantity: z.number().finite().nullable(),
  unit: z.string().nullable(),
  qualifier: z.string().nullable(),
  condition: z.string().nullable(),
  assertion: z.string().nullable(),
});
export type Claim = z.infer<typeof claim>;
export type Evidence = {
  id: number;
  fact: string;
  wording: string;
  start: string;
  until: string | null;
  variant: string;
};
export type Result = {
  claim: Claim;
  verdict: z.infer<typeof verdict>;
  explanation: string;
  suggestion: string | null;
  evidence: number[];
};
export const context = (variant: string) => ({
  product: ["Aster Standard", "Aster Trail"].includes(variant)
    ? "Aster Watch"
    : null,
  variant,
});

// Bounded grammar, never instructions: each entire sentence or line is checked.
// Offsets are zero-based UTF-16 code units, [start, stop), in the unchanged draft.
function parse(quote: string, start: number, variant: string): Claim {
  let text = quote.toLowerCase();
  let scope = context(variant);
  const prefix = /^aster watch (standard|trail):\s*/i.exec(text);
  if (prefix) {
    scope = context(
      prefix[1] === "standard" ? "Aster Standard" : "Aster Trail",
    );
    text = text.slice(prefix[0].length);
  }
  const c: Claim = {
    quote,
    start,
    stop: start + quote.length,
    ...scope,
    metric: "unknown",
    quantity: null,
    unit: null,
    qualifier: null,
    condition: null,
    assertion: null,
  };
  const battery =
    /^(?:(up to) )?(\d+) hours(?: (guaranteed))?(?: (in standard mode|with gps enabled))?$/.exec(
      text,
    );
  if (battery) {
    const quantity = Number(battery[2]);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return c;
    return {
      ...c,
      metric: "battery_life",
      quantity,
      unit: "hours",
      qualifier: battery[3] ? "guaranteed" : (battery[1] ?? null),
      condition: battery[4] ?? null,
    };
  }
  if (
    /^(black|silver|gold|red|blue)( and (black|silver|gold|red|blue))?$/.test(
      text,
    )
  )
    return { ...c, metric: "colours", assertion: text };
  if (/^(dual-band|single-band) gps$/.test(text))
    return { ...c, metric: "gps", assertion: text };
  return c;
}
export function extract(draft: string, variant: string): Claim[] {
  if (draft.length > 4000)
    throw Error("Draft exceeds the local verifier limit.");
  const claims: Claim[] = [];
  let start = 0;
  for (let index = 0; index <= draft.length; index++) {
    const char = draft[index];
    const decimal =
      char === "." &&
      /\d/.test(draft[index - 1] ?? "") &&
      /\d/.test(draft[index + 1] ?? "");
    if (index === draft.length || (!decimal && /[.!\r\n]/.test(char))) {
      const raw = draft.slice(start, index),
        quote = raw.trim();
      if (quote)
        claims.push(
          claim.parse(parse(quote, start + raw.indexOf(quote), variant)),
        );
      start = index + 1;
    }
  }
  // Empty / punctuation-only content is an explicit blocking result.
  return claims.length ? claims : [parse(draft, 0, variant)];
}
export function verify(
  c: Claim,
  evidence: Evidence[],
  publication: string,
): Result {
  const result = (
    v: Result["verdict"],
    explanation: string,
    sources: Evidence[] = [],
    suggestion: string | null = null,
  ): Result => ({
    claim: c,
    verdict: v,
    explanation,
    suggestion,
    evidence: sources.map((s) => s.id),
  });
  if (!c.product || c.metric === "unknown")
    return result(
      "Needs manual review",
      "The local watch grammar cannot interpret this complete assertion. No check passed.",
    );
  const scoped = evidence.filter(
    (e) =>
      e.variant === c.variant &&
      e.start <= publication &&
      (!e.until || publication < e.until),
  );
  const parsed = scoped.map((e) => ({
    source: e,
    claim: parse(e.wording, 0, e.variant),
  }));
  if (parsed.some((p) => p.claim.variant !== p.source.variant))
    return result(
      "Needs manual review",
      "An approved source quotes a different variant than its registry entry. Correct the registry before using it.",
    );
  const matches = parsed.filter((p) => p.claim.metric === c.metric);
  if (!matches.length) {
    if (parsed.some((p) => p.claim.metric === "unknown"))
      return result(
        "Needs manual review",
        "Applicable evidence contains wording the local verifier cannot interpret.",
        scoped,
      );
    return result(
      "Insufficient evidence",
      `No applicable ${c.metric} evidence for ${c.product} / ${c.variant} on ${publication}. Other variants and inactive versions are excluded.`,
    );
  }
  const sources = matches.map((p) => p.source);
  const distinct = new Set(
    matches.map((p) =>
      JSON.stringify({ ...p.claim, quote: "", start: 0, stop: 0 }),
    ),
  );
  if (distinct.size !== 1 || parsed.some((p) => p.claim.metric === "unknown"))
    return result(
      "Needs manual review",
      "Applicable sources are ambiguous or cannot all be interpreted. Resolve the registry before approval.",
      parsed
        .filter(
          (p) => p.claim.metric === c.metric || p.claim.metric === "unknown",
        )
        .map((p) => p.source),
    );
  const approved = matches[0].claim,
    source = sources[0];
  const says = `Source V${source.id} says “${source.wording}” for ${c.variant}. `;
  if (c.metric === "battery_life") {
    if (c.qualifier === "guaranteed" && approved.qualifier === "up to")
      return result(
        "Contradicted",
        says +
          "The draft promises a guaranteed runtime; the source approves only an upper bound, not a guarantee.",
        sources,
        source.wording,
      );
    if (c.condition !== approved.condition)
      return result(
        "Insufficient evidence",
        says +
          `Draft condition “${c.condition ?? "unspecified"}” differs from “${approved.condition ?? "unspecified"}”.`,
        sources,
        source.wording,
      );
    if (c.qualifier !== approved.qualifier) {
      const v =
        c.qualifier === "guaranteed" && approved.qualifier === "up to"
          ? "Contradicted"
          : "Insufficient evidence";
      return result(
        v,
        says +
          `Draft qualifier “${c.qualifier ?? "unspecified"}” is not the approved qualifier “${approved.qualifier ?? "unspecified"}”. An upper bound does not establish a guarantee.`,
        sources,
        source.wording,
      );
    }
    if (c.quantity !== approved.quantity)
      return result(
        c.quantity! > approved.quantity!
          ? "Contradicted"
          : "Insufficient evidence",
        says +
          `Draft quantity ${c.quantity} hours differs from the approved ${approved.quantity} hours. A different runtime is not approved.`,
        sources,
        source.wording,
      );
  } else if (
    c.metric === "colours" &&
    c.assertion
      ?.split(" and ")
      .every((colour) => approved.assertion?.split(" and ").includes(colour))
  ) {
    // A subset or reordered list of approved colours remains supported.
  } else if (c.assertion !== approved.assertion) {
    return result(
      "Insufficient evidence",
      says + `Draft assertion “${c.assertion}” lacks whole-claim support.`,
      sources,
      source.wording,
    );
  }
  return result(
    "Supported",
    says +
      "The complete draft assertion matches the approved metric, quantity, qualifier and condition.",
    sources,
  );
}
export function evaluate(
  draft: string,
  variant: string,
  evidence: Evidence[],
  publication: string,
): Result[] {
  try {
    return extract(draft, variant).map((c) => {
      if (draft.slice(c.start, c.stop) !== c.quote)
        throw Error("Invalid extracted span.");
      if (c.variant !== variant)
        return {
          claim: c,
          verdict: "Insufficient evidence" as const,
          explanation:
            "The draft names a different variant than this asset. No specification from another variant can clear this check.",
          suggestion: null,
          evidence: [],
        };
      return verify(c, evidence, publication);
    });
  } catch {
    return [
      {
        claim: parse(draft, 0, variant),
        verdict: "Needs manual review",
        explanation: "Local verification could not complete. No check passed.",
        suggestion: null,
        evidence: [],
      },
    ];
  }
}
