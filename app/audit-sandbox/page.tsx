"use client";
import React, { useState } from "react";
import Link from "next/link";
import { performUnifiedAudit, type FullAuditReport } from "../../lib/unified-audit";
import { BRAND_PACKS, getBrandPack } from "../../lib/brand-packs";
import { FindingCard } from "../components/FindingCard";
import { PageTitle } from "../components";
import {
  PreflightPlayground,
  type PlaygroundScenario,
} from "../components/PreflightPlayground";

export default function AuditSandboxPage() {
  const [selectedBrand, setSelectedBrand] = useState("aster-watch-v2");
  const [selectedChannel, setSelectedChannel] = useState("Web");
  const [inputText, setInputText] = useState(
    `# Aster Watch Launch Announcement\nExperience our revolutionary new aster watch featuring an unbreakable sapphire crystal screen.\nConnect via bluetooth and wifi to your phone for real-time tracking.\nFor confidential developer preview of PROJECT_NEBULA, contact monish@inkloom.ai with access token sk-prod99887766554433221100aabbccddeeff.\nAvailable at retail stores worldwide at a cheap price.`,
  );

  const [report, setReport] = useState<FullAuditReport | null>(null);

  function handleRunAudit() {
    const brand = getBrandPack(selectedBrand);
    const result = performUnifiedAudit({
      text: inputText,
      channel: selectedChannel,
      brandPack: brand,
      posterStyle: {
        foreground: "#777777",
        background: "#ffffff",
        kind: "solid",
      },
    });
    setReport(result);
  }

  function handleApplyFix(findingId: string, fixText: string) {
    if (!report) return;
    const finding = report.findings.find((f) => f.id === findingId);
    if (!finding) return;

    let updated = inputText;
    if (finding.quote) {
      updated = updated.replace(finding.quote, fixText);
    } else {
      updated = updated.replace(
        new RegExp(`\\b${finding.suggestedFix}\\b`, "i"),
        fixText,
      );
    }
    setInputText(updated);

    // Re-run audit with updated text
    const brand = getBrandPack(selectedBrand);
    const updatedReport = performUnifiedAudit({
      text: updated,
      channel: selectedChannel,
      brandPack: brand,
      posterStyle: {
        foreground: "#173b34",
        background: "#ffffff",
        kind: "solid",
      },
    });
    setReport(updatedReport);
  }

  function handleSelectScenario(scenario: PlaygroundScenario) {
    setInputText(scenario.draftText);
    const brand = getBrandPack(selectedBrand);
    const result = performUnifiedAudit({
      text: scenario.draftText,
      channel: selectedChannel,
      brandPack: brand,
      posterStyle: {
        foreground: scenario.fgColor,
        background: scenario.bgColor,
        kind: "solid",
      },
    });
    setReport(result);
  }

  return (
    <div className="sandbox-page-layout">
      <Link className="breadcrumb" href="/">
        ← Return to Campaign Desk
      </Link>

      <PageTitle
        eyebrow="SELF-SERVE PRE-FLIGHT ASSURANCE"
        title="Multi-Modal Pre-Publication Ingestion Sandbox"
        description="Paste any draft copy, press release, or document to execute instant 6-pillar verification against versioned Brand Packs before publishing."
      >
        <div className="publication-stamp">
          <span className="mini-label">ZERO EXTERNAL LEAKS</span>
          <strong>Local Execution</strong>
          <span>Zero PII Dispatched</span>
        </div>
      </PageTitle>

      {/* Configuration Controls Bar */}
      <div className="sandbox-controls-bar card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600" }}>
            TARGET BRAND PACK:
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              {BRAND_PACKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (v{b.version})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600" }}>
            PUBLICATION CHANNEL:
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              <option value="Web">Web Product Page</option>
              <option value="Email">Marketing Email</option>
              <option value="Social">Social Media Ad</option>
              <option value="Print">Print / Retail Poster</option>
            </select>
          </label>

          <button
            type="button"
            className="button"
            onClick={handleRunAudit}
            style={{ alignSelf: "flex-end", marginTop: "auto" }}
          >
            ⚡ Run 6-Pillar Pre-Flight Audit
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: report ? "1fr 1fr" : "1fr", gap: "20px" }}>
        {/* Left Column: Text Input Editor */}
        <div className="sandbox-editor-col card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span className="mini-label">INPUT CONTENT DRAFT</span>
            <small style={{ color: "#64748b" }}>{inputText.length} characters • {inputText.split(/\s+/).length} words</small>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={14}
            style={{
              width: "100%",
              padding: "12px",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.6",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setInputText(
                    `# Horizon Cloud Enterprise SLA\nHorizon Cloud guarantees 99.99% monthly uptime SLA with SOC 2 Type II compliance and AES-256 data encryption at rest.\nIntegrated single sign-on (SSO) and automated failover included.\nAvailable for enterprise deployment at a cheap price.`,
                  );
                  setSelectedBrand("inkloom-enterprise-v1");
                  setSelectedChannel("Web");
                }}
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                Template: Enterprise B2B SaaS
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setInputText(
                    `# Aster Watch Standard\nUp to 24 hours in standard mode. Precision-machined titanium case with black and silver finishes.\nDual-band GPS engineered for extreme endurance.\nAvailable at authorized retailers.`,
                  );
                  setSelectedBrand("aster-watch-v2");
                  setSelectedChannel("Web");
                }}
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                Template: Hardware Specs
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setInputText("");
                }}
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                Clear
              </button>
            </div>
            <button
              type="button"
              className="button"
              onClick={handleRunAudit}
            >
              Run Pre-Flight Audit →
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Findings & Report */}
        {report && (
          <div className="sandbox-results-col">
            {/* Score & KPI Header */}
            <div
              className="card"
              style={{
                padding: "20px",
                marginBottom: "16px",
                background:
                  report.status === "COMPLIANT"
                    ? "#f0fdf4"
                    : report.status === "ACTION_REQUIRED"
                      ? "#fefce8"
                      : "#fff5f5",
                borderColor:
                  report.status === "COMPLIANT"
                    ? "#bbf7d0"
                    : report.status === "ACTION_REQUIRED"
                      ? "#fef08a"
                      : "#fecaca",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="mini-label">OVERALL GOVERNANCE SCORE</span>
                  <div style={{ fontSize: "36px", fontWeight: "900", color: "#0f172a" }}>
                    {report.overallScore} / 100
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontWeight: "700",
                      fontSize: "12px",
                      background:
                        report.status === "COMPLIANT"
                          ? "#22c55e"
                          : report.status === "ACTION_REQUIRED"
                            ? "#eab308"
                            : "#ef4444",
                      color: "#fff",
                    }}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", marginTop: "14px", fontSize: "12px", color: "#475569" }}>
                <span><strong>Readability:</strong> Grade {report.metrics.readability.fleschKincaidGrade} ({report.metrics.readability.difficulty})</span>
                <span>•</span>
                <span><strong>PII Detected:</strong> {report.metrics.piiDetected ? "⚠️ Yes (Masked)" : "✓ None"}</span>
                <span>•</span>
                <span><strong>Issues:</strong> {report.findings.length} Flagged</span>
              </div>
            </div>

            {/* Findings List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {report.findings.length === 0 ? (
                <div className="card empty" style={{ padding: "30px", textAlign: "center" }}>
                  <h3 style={{ color: "#15803d", margin: "0 0 8px 0" }}>✓ All 6 Governance Pillars Cleared</h3>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    This copy fully satisfies brand lexicon, claim provenance, readability rubrics, and privacy standards. Ready for release sign-off.
                  </p>
                  <div style={{ marginTop: "16px" }}>
                    <Link className="button" href="/campaigns/aster/certificate">
                      View Official Audit Certificate →
                    </Link>
                  </div>
                </div>
              ) : (
                report.findings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    onApplyFix={handleApplyFix}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "36px" }}>
        <PreflightPlayground onSelectScenario={handleSelectScenario} />
      </div>
    </div>
  );
}
