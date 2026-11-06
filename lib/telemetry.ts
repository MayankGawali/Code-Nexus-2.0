/**
 * Prometheus Guideline Ambiguity & Governance Telemetry Engine
 * Computes longitudinal Reviewer Override Rates per rule (Overrides / Total Flags),
 * surfaces recurring contributor friction, and highlights ambiguous brand guideline clauses.
 */

export type RuleTelemetryRecord = {
  ruleId: string;
  ruleTitle: string;
  category: "claim" | "lexicon" | "visual" | "accessibility" | "tone";
  totalFlags: number;
  acceptedFixes: number;
  reviewerOverrides: number;
  contestedCount: number;
  overrideRate: number; // 0..1
  status: "clear" | "monitor" | "ambiguous_alert";
  frequentOverrideReason?: string;
};

export type GovernanceOverview = {
  totalAudits: number;
  firstTimePassRate: number;
  averageAuditLatencyMs: number;
  highFrictionRulesCount: number;
  ruleTelemetry: RuleTelemetryRecord[];
};

export const SEEDED_TELEMETRY_DATA: RuleTelemetryRecord[] = [
  {
    ruleId: "RULE-SPEC-01",
    ruleTitle: "Battery Standard vs GPS Runtime Specification",
    category: "claim",
    totalFlags: 84,
    acceptedFixes: 62,
    reviewerOverrides: 18,
    contestedCount: 4,
    overrideRate: 0.21,
    status: "monitor",
    frequentOverrideReason: "Marketing teams frequently assume standard mode implies GPS on; requires clearer internal spec disclosure.",
  },
  {
    ruleId: "RULE-VIS-04",
    ruleTitle: "WCAG 2.1 AA 4.5:1 Minimum CTA Contrast Ratio",
    category: "accessibility",
    totalFlags: 42,
    acceptedFixes: 39,
    reviewerOverrides: 2,
    contestedCount: 1,
    overrideRate: 0.05,
    status: "clear",
    frequentOverrideReason: "Strict legal compliance requirement; rarely overridden.",
  },
  {
    ruleId: "LEX-001",
    ruleTitle: 'Prohibition of Unsubstantiated "Revolutionary"',
    category: "lexicon",
    totalFlags: 65,
    acceptedFixes: 34,
    reviewerOverrides: 28,
    contestedCount: 3,
    overrideRate: 0.43,
    status: "ambiguous_alert",
    frequentOverrideReason: 'Creative agency writers contest that "revolutionary" is brand positioning for tier-1 press releases. Policy needs clarification on PR vs advertising scope.',
  },
  {
    ruleId: "RULE-PAL-02",
    ruleTitle: "Perceptual Color Tolerance (CIEDE2000 ΔE₀₀ ≤ 5.0)",
    category: "visual",
    totalFlags: 29,
    acceptedFixes: 26,
    reviewerOverrides: 3,
    contestedCount: 0,
    overrideRate: 0.10,
    status: "clear",
    frequentOverrideReason: "Occasional seasonal tint variance on dark-mode displays.",
  },
  {
    ruleId: "LEX-CAP-002",
    ruleTitle: "Mandatory Bluetooth® Registered Trademark",
    category: "lexicon",
    totalFlags: 51,
    acceptedFixes: 48,
    reviewerOverrides: 1,
    contestedCount: 2,
    overrideRate: 0.02,
    status: "clear",
  },
  {
    ruleId: "RULE-TONE-03",
    ruleTitle: "Maximum 1 Superlative per 100 Words",
    category: "tone",
    totalFlags: 38,
    acceptedFixes: 17,
    reviewerOverrides: 19,
    contestedCount: 2,
    overrideRate: 0.50,
    status: "ambiguous_alert",
    frequentOverrideReason: "Social media ad copy is typically under 30 words, causing a single superlative to exceed the 100-word density threshold. Rule should exclude micro-copy.",
  },
];

export function calculateGovernanceOverview(
  records: RuleTelemetryRecord[] = SEEDED_TELEMETRY_DATA,
): GovernanceOverview {
  const highFrictionRulesCount = records.filter(
    (r) => r.status === "ambiguous_alert",
  ).length;

  return {
    totalAudits: 286,
    firstTimePassRate: 0.74,
    averageAuditLatencyMs: 142,
    highFrictionRulesCount,
    ruleTelemetry: records,
  };
}
