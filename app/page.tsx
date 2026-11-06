import Link from "next/link";
import { database } from "../lib/db";
import { campaigns, assets, status } from "../lib/review";
import { Form, Submit } from "./form";
import { Hidden, Badge } from "./fields";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = database(),
    list = campaigns(db);

  return (
    <>
      <section className="landing">
        <div>
          <p className="eyebrow">ENTERPRISE PRE-PUBLICATION GOVERNANCE</p>
          <h1>
            Good creative.
            <br />
            Grounded claims.
          </h1>
          <p className="lede">
            Centralized pre-publication assurance desk. Verify quantitative claims, brand lexicon, visual palettes, and WCAG accessibility before any marketing asset goes live.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "14px 0" }}>
            {list[0] ? (
              <Link className="button" href={"/campaigns/" + list[0].id}>
                Open {list[0].name} <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <Form path="/">
                <Hidden values={{ action: "start" }} />
                <Submit>Load Aster Watch demo →</Submit>
              </Form>
            )}
            <Link className="button secondary" href="/audit-sandbox">
              ⚡ Pre-Flight Audit Sandbox →
            </Link>
          </div>
          <p className="quiet">
            Multi-campaign governance. Deterministic local math, zero external leaks, immutable SQLite audit trails.
          </p>
        </div>
        <div className="intro-card">
          <span className="mini-label">ENTERPRISE GOVERNANCE WORKFLOW</span>
          <ol>
            <li>
              <b>01</b>
              <div>
                <strong>Single Source of Truth</strong>
                <p>Register approved product facts, metrics, and effective date intervals.</p>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>Parallel 6-Pillar Audit</strong>
                <p>Trace every assertion to exact sources, check colors, contrast, and lexicon.</p>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>Sign-off & Certificate</strong>
                <p>Collaborative role review, human overrides with rationale, and SHA-256 certificate.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Quick Campaign Creation Form */}
      <details className="card" style={{ marginBottom: "24px", padding: "16px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "700", color: "#1e40af" }}>
          ➕ Create a New Company Campaign
        </summary>
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
          <Form path="/" className="stack">
            <Hidden values={{ action: "create_campaign" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <label>
                Campaign Name
                <input
                  name="name"
                  placeholder="e.g. Horizon Cloud Q4 Release"
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Campaign Slug ID
                <input
                  name="id"
                  placeholder="e.g. horizon-q4"
                  required
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="Alphanumeric and hyphens only"
                  maxLength={40}
                />
              </label>
              <label>
                Target Publication Date
                <input
                  type="date"
                  name="publication"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </label>
            </div>
            <div style={{ marginTop: "10px" }}>
              <Submit>Create Campaign & Open Desk →</Submit>
            </div>
          </Form>
        </div>
      </details>

      <div className="section-heading">
        <h2>Active company campaigns</h2>
        <span>
          {list.length} {list.length === 1 ? "campaign" : "campaigns"}
        </span>
      </div>

      {!list.length && (
        <div className="empty card">
          No campaigns found. Create a new campaign above to configure your assets and approved specifications.
        </div>
      )}

      <div className="campaign-grid">
        {list.map((c) => {
          const all = assets(db, c.id),
            approved = all.filter(
              (a) => status(db, a.id) === "Approved",
            ).length;
          return (
            <Link
              href={"/campaigns/" + c.id}
              className="campaign-card card"
              key={c.id}
            >
              <div className="campaign-art" aria-hidden="true">
                <div className="watch">
                  <span>PROMETHEUS</span>
                  <b>{c.publication.slice(5)}</b>
                </div>
                <span>
                  {c.name.slice(0, 10).toUpperCase()}
                </span>
              </div>
              <div className="campaign-caption">
                <p className="eyebrow">GOVERNED CAMPAIGN</p>
                <h2>
                  {c.name} <span aria-hidden="true">↗</span>
                </h2>
                <p>
                  Target Release: {c.publication} · {all.length} {all.length === 1 ? "asset" : "assets"}
                </p>
                <Badge
                  value={
                    approved === all.length && all.length > 0
                      ? "Approved"
                      : "In review"
                  }
                />
                <span className="quiet">
                  {approved} of {all.length} assets approved
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Six-Pillar Architecture Showcase */}
      <section className="architecture-showcase-section card" style={{ marginTop: "36px", padding: "28px" }}>
        <div className="showcase-header">
          <span className="mini-label">ENTERPRISE BRAND ASSURANCE SYSTEM</span>
          <h2 style={{ margin: "6px 0 10px 0" }}>Six-Pillar Pre-Publication Governance Pipeline</h2>
          <p className="lede" style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
            Engineered for high-velocity marketing and product teams to eliminate compliance bottlenecks, regulatory liabilities, and brand fragmentation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>⏱️</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>1. Grounded Temporal Claims NLI</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Verifies quantitative and comparative assertions against date-bounded registry specifications with verbatim source citations.
            </p>
          </div>

          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>2. Aho-Corasick Lexicon Scanner</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Sub-millisecond trie dictionary scanner flags forbidden buzzwords, unverified superlatives, and required trademark casing.
            </p>
          </div>

          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>🎯</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>3. Intent-Preserving Rewriter</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Generates compliant candidate rewrites while mathematically enforcing semantic preservation (CosineSim ≥ 0.85).
            </p>
          </div>

          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>🎨</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>4. Perceptual Color (CIEDE2000)</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Measures perceptual color difference in CIE L*a*b* space (ΔE₀₀ ≤ 5.0) and validates logo aspect ratios and 64-bit DCT pHash.
            </p>
          </div>

          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>👁️</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>5. WCAG 2.1 AA Accessibility</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Calculates relative luminance ratios (≥ 4.5:1), synthesizes accessible colors, checks heading hierarchy and alt-text.
            </p>
          </div>

          <div className="pillar-info-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            <strong style={{ display: "block", margin: "6px 0 4px 0", color: "#0f172a" }}>6. Closed-Loop Telemetry</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Computes Reviewer Override Rates per rule (Overrides / Total Flags) to automatically surface ambiguous brand guidelines for admins.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            <strong>Prometheus Enterprise Core:</strong> Role-Based Access Control • Full Audit Lineage • Zero-Data-Retention Architecture
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link className="text-link" href="/campaigns/aster/rules">
              View Brand Pack Specs →
            </Link>
            <Link className="text-link" href="/campaigns/aster/telemetry" style={{ marginLeft: "12px" }}>
              View Ambiguity Telemetry →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
