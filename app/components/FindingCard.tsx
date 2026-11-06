"use client";
import React, { useState } from "react";
import type { UnifiedFinding } from "../../lib/unified-audit";

export type FindingCardProps = {
  finding: UnifiedFinding;
  onApplyFix?: (findingId: string, fixText: string) => void;
  onOverride?: (findingId: string, rationale: string) => void;
  canOverride?: boolean;
};

export function FindingCard({
  finding,
  onApplyFix,
  onOverride,
  canOverride = true,
}: FindingCardProps) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [rationale, setRationale] = useState("");
  const [isOverridden, setIsOverridden] = useState(false);

  function handleApplyFix() {
    if (finding.suggestedFix && onApplyFix) {
      onApplyFix(finding.id, finding.suggestedFix);
    }
  }

  function handleSaveOverride(e: React.FormEvent) {
    e.preventDefault();
    if (rationale.trim() && onOverride) {
      onOverride(finding.id, rationale.trim());
      setIsOverridden(true);
      setOverrideOpen(false);
    }
  }

  const severityClass = `sev-${finding.severity}`;
  const verdictClass = `verdict-${finding.verdict.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className={`finding-card ${severityClass} ${isOverridden ? "is-overridden" : ""}`}
      id={`finding-${finding.id}`}
    >
      <div className="card-top-bar">
        <div className="card-left-tags">
          <span className={`severity-badge ${severityClass}`}>
            {finding.severity.toUpperCase()} SEVERITY
          </span>
          <span className={`verdict-badge ${verdictClass}`}>
            {finding.verdict}
          </span>
          <span className="provenance-tag">{finding.engineProvenance}</span>
        </div>
        <span className="citation-id-tag">Rule: {finding.citationId}</span>
      </div>

      <h4 className="finding-title">{finding.title}</h4>

      {finding.quote && (
        <div className="flagged-quote-box">
          <span className="quote-label">FLAGGED TEXT SPAN:</span>
          <blockquote className="flagged-span-text">“{finding.quote}”</blockquote>
        </div>
      )}

      <p className="finding-explanation-text">{finding.explanation}</p>

      <div className="citation-reference-box">
        <span className="citation-label">CITED SOURCE:</span>
        <span className="citation-source-name">{finding.citationSource}</span>
      </div>

      {finding.suggestedFix && !isOverridden && (
        <div className="remediation-proposal-box">
          <div className="proposal-header">
            <span className="proposal-label">PROPOSED COMPLIANT REMEDIATION</span>
            {finding.semanticSimilarity !== undefined && (
              <span className="semantic-score-badge">
                {(finding.semanticSimilarity * 100).toFixed(0)}% Intent Preserved
              </span>
            )}
          </div>
          <div className="remediation-replacement-text">
            <strong>{finding.suggestedFix}</strong>
          </div>
          <div className="card-actions-row">
            <button
              type="button"
              className="action-btn apply-fix-btn"
              onClick={handleApplyFix}
            >
              ✓ Apply 1-Click Fix
            </button>
            {canOverride && (
              <button
                type="button"
                className="action-btn override-btn"
                onClick={() => setOverrideOpen(!overrideOpen)}
              >
                ⚖ Override with Rationale
              </button>
            )}
          </div>
        </div>
      )}

      {isOverridden && (
        <div className="override-recorded-banner">
          <span className="override-icon">⚖</span>
          <div>
            <strong>Human Override Recorded:</strong> "{rationale}"
            <div className="override-author-stamp">
              Recorded by Authorized Reviewer • Audit Trail Locked
            </div>
          </div>
        </div>
      )}

      {overrideOpen && !isOverridden && (
        <form onSubmit={handleSaveOverride} className="override-form-box">
          <label className="override-label">
            Mandatory Business / Legal Justification for Exception:
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="e.g., Tier-1 press release approved by VP of Product Marketing under exception clause 4.2..."
            rows={2}
            className="override-textarea"
            required
          />
          <div className="override-buttons">
            <button type="submit" className="action-btn submit-override-btn">
              Record Override into Immutable Audit Log
            </button>
            <button
              type="button"
              className="action-btn cancel-btn"
              onClick={() => setOverrideOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

