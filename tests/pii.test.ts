import { describe, it, expect } from "vitest";
import { redactSecretsAndPii } from "../lib/pii-redactor";
import { synthesizeIntentPreservingRewrite } from "../lib/intent-rewrite";

describe("PII Redaction and Intent-Preserving Rewrite Engines", () => {
  it("redacts API keys and emails before processing", () => {
    const text =
      "Contact support@inkloom.ai with your token sk-abcdef1234567890abcdef1234567890.";
    const result = redactSecretsAndPii(text);

    expect(result.hasRedactions).toBe(true);
    expect(result.sanitized).toContain("[REDACTED_EMAIL]");
    expect(result.sanitized).toContain("[REDACTED_API_KEY]");
    expect(result.sanitized).not.toContain("sk-");
  });

  it("calculates high cosine similarity for compliant rewrites", () => {
    const orig = "Experience our revolutionary new Aster Watch battery.";
    const rewrite = synthesizeIntentPreservingRewrite(orig, [
      { target: "revolutionary", replacement: "innovative", ruleId: "LEX-001" },
    ]);

    expect(rewrite.preservesIntent).toBe(true);
    expect(rewrite.semanticSimilarity).toBeGreaterThanOrEqual(0.85);
    expect(rewrite.suggested).toBe(
      "Experience our innovative new Aster Watch battery.",
    );
  });
});
