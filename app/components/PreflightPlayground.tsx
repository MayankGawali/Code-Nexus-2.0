"use client";
import React from "react";

export type PlaygroundScenario = {
  id: string;
  title: string;
  pillar: string;
  badge: string;
  draftText: string;
  fgColor: string;
  bgColor: string;
  description: string;
};

export const PRESET_SCENARIOS: PlaygroundScenario[] = [
  {
    id: "clean-approved",
    title: "1. 100% Approved Baseline",
    pillar: "Claim Verification",
    badge: "CLEAN PASS",
    draftText: "Up to 24 hours in standard mode. Black and silver case finishes.",
    fgColor: "#ffffff",
    bgColor: "#173b34",
    description: "Fully compliant text matching approved registry specs and brand color palette.",
  },
  {
    id: "banned-buzzwords",
    title: "2. Forbidden Superlatives & Buzzwords",
    pillar: "Aho-Corasick Lexicon",
    badge: "LEXICON RISK",
    draftText:
      "Our revolutionary new Aster Watch features an unbreakable sapphire screen at a cheap price.",
    fgColor: "#ffffff",
    bgColor: "#173b34",
    description:
      "Triggers LEX-001 (revolutionary), LEX-002 (unbreakable), and LEX-005 (cheap) with 1-click intent-preserving rewrites.",
  },
  {
    id: "trademark-drift",
    title: "3. Trademark & Capitalization Drift",
    pillar: "Brand Governance",
    badge: "STYLE DRIFT",
    draftText:
      "Pair your aster watch effortlessly via bluetooth and wifi to experience next-gen ai tracking.",
    fgColor: "#ffffff",
    bgColor: "#173b34",
    description:
      "Detects uncapitalized 'aster watch', missing 'Bluetooth®' trademark, unhyphenated 'wifi', and lowercase 'ai'.",
  },
  {
    id: "wcag-contrast-defect",
    title: "4. Accessibility Contrast Defect",
    pillar: "WCAG 2.1 AA",
    badge: "ACCESSIBILITY",
    draftText: "Up to 24 hours in standard mode.",
    fgColor: "#777777",
    bgColor: "#ffffff",
    description:
      "Muted grey #777777 on white measures 4.48:1 (below 4.5:1 requirement). Test the Auto-Synthesize Accessible Color button!",
  },
  {
    id: "pii-secret-leak",
    title: "5. PII & Secret Credential Leak",
    pillar: "Security & Privacy",
    badge: "CRITICAL SECURITY",
    draftText:
      "For beta access to PROJECT_NEBULA, contact monish@inkloom.ai with deployment key sk-9876543210abcdef9876543210abcdef.",
    fgColor: "#ffffff",
    bgColor: "#173b34",
    description:
      "Deterministic regex masks confidential project codename, email address, and OpenAI secret key before model inspection.",
  },
  {
    id: "outdated-spec-conflict",
    title: "6. Outdated Specification Conflict",
    pillar: "Temporal NLI Verification",
    badge: "FACT CONTRADICTION",
    draftText: "Up to 32 hours in standard mode with dual-band GPS.",
    fgColor: "#ffffff",
    bgColor: "#173b34",
    description:
      "Factual conflict: Claim states 32 hours whereas registry source approves only 24 hours.",
  },
];

export function PreflightPlayground({
  onSelectScenario,
}: {
  onSelectScenario: (scenario: PlaygroundScenario) => void;
}) {
  return (
    <div className="playground-panel">
      <div className="playground-header">
        <span className="mini-label">ENTERPRISE PRE-FLIGHT GOVERNANCE BENCHMARK</span>
        <h4>Quick Test Presets (Instant 6-Pillar Violation Showcase)</h4>
        <p className="playground-sub">
          Click any preset to instantly test real-world enterprise compliance edge cases across all six governance dimensions.
        </p>
      </div>

      <div className="preset-cards-grid">
        {PRESET_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="preset-card-btn"
            onClick={() => onSelectScenario(s)}
          >
            <div className="preset-card-top">
              <span className="preset-badge">{s.badge}</span>
              <span className="preset-pillar">{s.pillar}</span>
            </div>
            <strong className="preset-title">{s.title}</strong>
            <p className="preset-desc">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

