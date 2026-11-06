import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { connect, migrate, type DB } from "../lib/db";
import * as r from "../lib/review";
import { generateAuditCertificate } from "../lib/certificate";
import { performUnifiedAudit } from "../lib/unified-audit";
import { getBrandPack } from "../lib/brand-packs";

describe("Enterprise End-to-End Governance Workflow", () => {
  let db: DB;

  beforeEach(() => {
    db = connect(":memory:");
    migrate(db);
  });

  afterEach(() => db.close());

  it("supports creating a custom company campaign and assets from scratch", () => {
    // 1. Company creates a new campaign
    const campaignId = r.addCampaign(
      db,
      "horizon-cloud-q4",
      "Horizon Cloud Q4 Enterprise Launch",
      "2026-12-15",
    );
    expect(campaignId).toBe("horizon-cloud-q4");

    const campaignList = r.campaigns(db);
    expect(campaignList.some((c) => c.id === "horizon-cloud-q4")).toBe(true);

    // 2. Company registers an approved specification / fact (without sentence punctuation)
    const factId = r.addFact(
      db,
      "Horizon Enterprise",
      "Uptime SLA Guarantee",
      "99 percent monthly uptime SLA in standard cloud deployment",
      "2026-01-01",
    );
    expect(factId).toBeDefined();

    // 3. Company adds a new marketing asset (e.g. Web Product Page)
    const assetId = r.addAsset(
      db,
      "horizon-sla-page",
      "horizon-cloud-q4",
      "SLA & Reliability Page",
      "Web",
      "Horizon Enterprise",
      "99 percent monthly uptime SLA in standard cloud deployment.",
    );
    expect(assetId).toBe("horizon-sla-page");

    // 4. Verify initial audit was created
    const rev = r.revisions(db, assetId)[0];
    expect(rev).toBeDefined();
    expect(rev.body).toBe(
      "99 percent monthly uptime SLA in standard cloud deployment.",
    );

    const audits = r.audits(db, rev.id);
    expect(audits.length).toBeGreaterThanOrEqual(1);

    // 5. The assertion matches approved fact -> Supported!
    const findings = r.findings(db, audits[0].id);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].verdict).toBe("Supported");

    // 6. Sign off and approve revision
    r.approve(db, audits[0].id);
    expect(r.status(db, assetId)).toBe("Approved");

    // 7. Generate cryptographic certificate
    const cert = generateAuditCertificate({
      campaignId: "horizon-cloud-q4",
      campaignName: "Horizon Cloud Q4 Enterprise Launch",
      assetId: "horizon-sla-page",
      assetName: "SLA & Reliability Page",
      channel: "Web",
      revisionId: rev.id,
      auditId: audits[0].id,
      publicationDate: "2026-12-15",
      assetBody: rev.body,
      certifyingOfficer: "Monish Mr (Compliance Officer)",
    });

    expect(cert.status).toBe("APPROVED_FOR_PUBLICATION");
    expect(cert.complianceScore).toBe(100);
    expect(cert.sha256Digest).toBeDefined();
  });

  it("runs unified multi-pillar pre-flight audit for Acme Cloud SaaS copy", () => {
    const acmeBrand = getBrandPack("acme-cloud-v1");
    const draftText = `
# Acme Cloud Infrastructure
Acme Cloud delivers reliable enterprise cloud hosting.
Connect via Bluetooth® and Wi-Fi to your edge clusters.
Contact our authorized enterprise partners for migration planning.
`;
    const report = performUnifiedAudit({
      text: draftText,
      channel: "Web",
      brandPack: acmeBrand,
      posterStyle: {
        foreground: "#00B4D8",
        background: "#0A192F",
        kind: "solid",
      },
    });

    expect(report.brandPackId).toBe("acme-cloud-v1");
    expect(report.status).toBe("COMPLIANT");
    expect(report.overallScore).toBeGreaterThanOrEqual(90);
  });

  it("detects quantitative contradictions and needs-review states for custom company claims", () => {
    r.addCampaign(db, "saas-launch", "SaaS Platform Launch", "2026-12-01");
    r.addFact(
      db,
      "SaaS Core",
      "Response Time",
      "Guaranteed under 25ms latency across all global edge points",
      "2026-01-01",
    );

    // Asset with contradictory latency number (50ms instead of 25ms)
    const assetId = r.addAsset(
      db,
      "perf-page",
      "saas-launch",
      "Performance Page",
      "Web",
      "SaaS Core",
      "Guaranteed under 50ms latency across all global edge points.",
    );

    const rev = r.revisions(db, assetId)[0];
    const audit = r.audits(db, rev.id)[0];
    const findings = r.findings(db, audit.id);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].verdict).toBe("Contradicted");
    expect(findings[0].suggestion).toContain("25ms");
  });
});
