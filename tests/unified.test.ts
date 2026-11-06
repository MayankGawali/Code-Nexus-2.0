import { describe, it, expect } from "vitest";
import { performUnifiedAudit } from "../lib/unified-audit";
import { generateAuditCertificate } from "../lib/certificate";
import { ASTER_WATCH_BRAND_PACK } from "../lib/brand-packs";

describe("Unified Multi-Modal Audit & Certificate", () => {
  it("performs multi-pillar audit catching lexicon, PII, and contrast issues concurrently", () => {
    const draftText = `
# Welcome to aster watch
Our revolutionary watch includes an unbreakable sapphire glass.
For assistance contact lead@inkloom.ai with your key sk-99887766554433221100aabbccddeeff.
`;
    const report = performUnifiedAudit({
      text: draftText,
      channel: "Web",
      brandPack: ASTER_WATCH_BRAND_PACK,
      posterStyle: {
        foreground: "#777777",
        background: "#ffffff",
        kind: "solid",
      },
    });

    expect(report.status).toBe("NON_COMPLIANT");
    expect(report.findings.length).toBeGreaterThanOrEqual(4);

    const pillars = report.findings.map((f) => f.pillar);
    expect(pillars).toContain("security_and_pii");
    expect(pillars).toContain("terminology_lexicon");
    expect(pillars).toContain("wcag_accessibility");

    const piiKeyFinding = report.findings.find(
      (f) =>
        f.pillar === "security_and_pii" &&
        f.suggestedFix === "[REDACTED_API_KEY]",
    );
    expect(piiKeyFinding?.verdict).toBe("Contradicted");
    expect(piiKeyFinding?.suggestedFix).toBe("[REDACTED_API_KEY]");
  });

  it("generates a cryptographic tamper-evident audit certificate", () => {
    const cert = generateAuditCertificate({
      campaignId: "aster",
      campaignName: "Aster Watch Rehearsal",
      assetId: "email",
      assetName: "Launch Email",
      channel: "Email",
      revisionId: 1,
      auditId: 101,
      publicationDate: "2026-11-20",
      assetBody: "Up to 24 hours in standard mode.",
    });

    expect(cert.certificateId).toMatch(/^CERT-PROMETHEUS-ASTER-\d+$/);
    expect(cert.sha256Digest.length).toBe(64);
    expect(cert.status).toBe("APPROVED_FOR_PUBLICATION");
    expect(cert.complianceScore).toBe(100);
  });
});
