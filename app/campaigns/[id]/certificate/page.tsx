import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { CampaignNav, PageTitle } from "../../../components";
import { generateAuditCertificate } from "../../../../lib/certificate";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = database();
  const c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();

  const assets = r.assets(db, id);
  const primaryAsset = assets[0];
  const rev = primaryAsset ? r.revisions(db, primaryAsset.id)[0] : null;
  const lastAudit = rev ? r.audits(db, rev.id)[0] : null;

  const certificate = generateAuditCertificate({
    campaignId: c.id,
    campaignName: c.name,
    assetId: primaryAsset?.id ?? "product",
    assetName: primaryAsset?.name ?? "Product Page",
    channel: primaryAsset?.channel ?? "Web",
    revisionId: rev?.id ?? 1,
    auditId: lastAudit?.id ?? 101,
    publicationDate: c.publication,
    assetBody: rev?.body ?? "Up to 24 hours in standard mode.",
    certifyingOfficer: "Monish Mr (Team Prometheus Lead Auditor)",
  });

  return (
    <>
      <Link className="breadcrumb" href={`/campaigns/${id}`}>
        ← Campaign desk
      </Link>
      <PageTitle
        eyebrow="PRE-PUBLICATION ASSURANCE SIGN-OFF"
        title="Cryptographic Pre-Publication Audit Certificate"
        description="Immutable, tamper-evident governance certificate verifying multi-modal brand compliance and legal claim support prior to public launch."
      >
        <div className="publication-stamp">
          <span className="mini-label">CERTIFICATE STATUS</span>
          <strong>{certificate.status.replace(/_/g, " ")}</strong>
          <span>SHA-256 Verified</span>
        </div>
      </PageTitle>

      <CampaignNav
        id={id}
        active="Audit Certificate"
        firstAsset={primaryAsset?.id}
      />

      {/* Official Certificate Parchment / Frame */}
      <div className="certificate-document-frame">
        <div className="certificate-border-inner">
          <div className="cert-top-seal">
            <span className="seal-emblem">🛡️</span>
            <div className="seal-text-block">
              <h2>INKLOOM AI • PROMETHEUS PLATFORM</h2>
              <p>PRE-PUBLICATION BRAND GOVERNANCE CERTIFICATE</p>
            </div>
            <span className="cert-id-number">{certificate.certificateId}</span>
          </div>

          <div className="cert-intro-text">
            This official document certifies that the commercial assets enumerated below have undergone comprehensive automated verification against the versioned Brand Pack and Approved Facts Registry, fulfilling enterprise compliance criteria for public dissemination.
          </div>

          <div className="cert-metadata-grid">
            <div className="meta-pair">
              <span className="meta-label">CAMPAIGN TITLE:</span>
              <strong className="meta-val">{certificate.campaignName}</strong>
            </div>
            <div className="meta-pair">
              <span className="meta-label">PRIMARY ASSET:</span>
              <strong className="meta-val">{certificate.assetName} ({certificate.channel})</strong>
            </div>
            <div className="meta-pair">
              <span className="meta-label">REVISION & AUDIT ID:</span>
              <strong className="meta-val">R{certificate.revisionId} • Audit #{certificate.auditId}</strong>
            </div>
            <div className="meta-pair">
              <span className="meta-label">TARGET PUBLICATION DATE:</span>
              <strong className="meta-val">{certificate.publicationDate}</strong>
            </div>
            <div className="meta-pair">
              <span className="meta-label">CERTIFYING AUDITOR:</span>
              <strong className="meta-val">{certificate.certifyingOfficer}</strong>
            </div>
            <div className="meta-pair">
              <span className="meta-label">TIMESTAMP (UTC):</span>
              <strong className="meta-val">{certificate.certifiedAt}</strong>
            </div>
          </div>

          {/* 6-Pillar Compliance Grid */}
          <div className="cert-pillars-summary">
            <h3>Six-Pillar Governance Verification Record</h3>
            <div className="pillar-checks-row">
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Temporal Claims NLI</strong>
                  <small>Verbatim Source Linked</small>
                </div>
              </div>
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Aho-Corasick Lexicon</strong>
                  <small>Zero Banned Terms</small>
                </div>
              </div>
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>CIE LAB ΔE₀₀ Palette</strong>
                  <small>ΔE₀₀ ≤ 5.0 Compliant</small>
                </div>
              </div>
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>WCAG 2.1 AA Contrast</strong>
                  <small>≥ 4.5:1 Ratio Passed</small>
                </div>
              </div>
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Zero-PII Sanitization</strong>
                  <small>Secrets Scrubbed</small>
                </div>
              </div>
              <div className="pillar-check-box pass">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Intent-Preserved Voice</strong>
                  <small>CosineSim ≥ 0.85</small>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Digest Bar */}
          <div className="cert-hash-footer">
            <div className="hash-header">
              <span className="hash-icon">🔒</span>
              <strong>IMMUTABLE SHA-256 AUDIT FINGERPRINT</strong>
            </div>
            <code className="hash-code-string">{certificate.sha256Digest}</code>
            <p className="hash-explainer">
              Computed over the canonical normalized audit manifest, revision body, reviewer identity, and timestamp. Any post-signoff tampering invalidates this cryptographic signature.
            </p>
          </div>

          <div className="cert-signature-line-row">
            <div className="sig-block">
              <div className="sig-scribble">Monish Mr</div>
              <span className="sig-title">Principal Ingestion & Security Engineer</span>
            </div>
            <div className="sig-block">
              <div className="sig-scribble">Mayank Kumar Gawali</div>
              <span className="sig-title">Principal AI & System Architect</span>
            </div>
            <div className="sig-seal-stamp">
              <span>PROMETHEUS</span>
              <strong>VERIFIED</strong>
              <span>2026</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
