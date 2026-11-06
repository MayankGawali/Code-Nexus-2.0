import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { CampaignNav, PageTitle } from "../../../components";
import {
  calculateGovernanceOverview,
  SEEDED_TELEMETRY_DATA,
} from "../../../../lib/telemetry";

export const dynamic = "force-dynamic";

export default async function TelemetryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = database();
  const c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();

  const overview = calculateGovernanceOverview(SEEDED_TELEMETRY_DATA);

  return (
    <>
      <Link className="breadcrumb" href={`/campaigns/${id}`}>
        ← Campaign desk
      </Link>
      <PageTitle
        eyebrow="CLOSED-LOOP GOVERNANCE TELEMETRY"
        title="Guideline Ambiguity & Reviewer Override Analytics"
        description="Stage 6 closed-loop intelligence: computes Reviewer Override Rates per rule (Overrides / Total Flags) to pinpoint ambiguous or conflicting brand clauses."
      >
        <div className="publication-stamp">
          <span className="mini-label">HIGH FRICTION CLAUSES</span>
          <strong>{overview.highFrictionRulesCount} Active Alerts</strong>
          <span>Admin Review Recommended</span>
        </div>
      </PageTitle>

      <CampaignNav id={id} active="Governance Telemetry" />

      {/* High-level KPI Row */}
      <div className="telemetry-kpis-grid">
        <div className="kpi-card">
          <span className="kpi-num">{overview.totalAudits}</span>
          <span className="kpi-label">Total Pre-Publication Audits</span>
          <small className="kpi-sub">Across Web, Email, Social & Print</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-num">{(overview.firstTimePassRate * 100).toFixed(0)}%</span>
          <span className="kpi-label">First-Time Pass Rate</span>
          <small className="kpi-sub">Drafts approved without revision</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-num">{overview.averageAuditLatencyMs} ms</span>
          <span className="kpi-label">Average Audit Latency</span>
          <small className="kpi-sub">Sub-second neuro-symbolic speed</small>
        </div>
        <div className="kpi-card alert">
          <span className="kpi-num">{overview.highFrictionRulesCount}</span>
          <span className="kpi-label">Ambiguous Clauses</span>
          <small className="kpi-sub">Override rate &gt; 25%</small>
        </div>
      </div>

      {/* Detailed Rule Friction Table */}
      <section className="telemetry-section-card">
        <div className="section-head">
          <span className="mini-label">LONGITUDINAL RULE FRICTION INDEX</span>
          <h3>Reviewer Override Rates per Brand Guideline Rule</h3>
          <p className="section-sub">
            When authorized reviewers repeatedly override an automated finding, the problem is rarely contributor error—it signals an ambiguous or outdated guideline clause that needs administrative calibration.
          </p>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Guideline Title</th>
                <th>Pillar</th>
                <th>Total Flags</th>
                <th>Accepted Fixes</th>
                <th>Reviewer Overrides</th>
                <th>Override Rate</th>
                <th>Guideline Health</th>
              </tr>
            </thead>
            <tbody>
              {overview.ruleTelemetry.map((rec) => {
                const ratePct = (rec.overrideRate * 100).toFixed(0);
                return (
                  <tr key={rec.ruleId}>
                    <td>
                      <code>{rec.ruleId}</code>
                    </td>
                    <td>
                      <strong>{rec.ruleTitle}</strong>
                      {rec.frequentOverrideReason && (
                        <div className="override-reason-hint">
                          💬 <em>Reviewer note:</em> {rec.frequentOverrideReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="category-chip">{rec.category}</span>
                    </td>
                    <td>{rec.totalFlags}</td>
                    <td>{rec.acceptedFixes}</td>
                    <td>
                      <strong>{rec.reviewerOverrides}</strong>
                    </td>
                    <td>
                      <div className="override-rate-bar-container">
                        <span className="rate-percent-text">{ratePct}%</span>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-fill ${rec.status}`}
                            style={{ width: `${ratePct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${rec.status}`}>
                        {rec.status === "ambiguous_alert"
                          ? "⚠️ AMBIGUOUS"
                          : rec.status === "monitor"
                            ? "👀 MONITOR"
                            : "✓ HEALTHY"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closed-loop recommendations */}
      <section className="recommendation-callout">
        <div className="callout-icon">💡</div>
        <div>
          <h4>Administrator Action Plan (Closed-Loop Rule Refinement)</h4>
          <ul>
            <li>
              <strong>Clarify LEX-001 ("revolutionary") for Press Releases:</strong>{" "}
              34% of creative copywriters override this flag on Tier-1 press releases. Recommend creating a channel-specific exception for corporate PR while keeping the prohibition for retail product copy.
            </li>
            <li>
              <strong>Update RULE-TONE-03 for Micro-Copy:</strong> Social media posts under 30 words are triggering false alarms on density calculation. Recommend updating formula to exempt assets under 50 words.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

