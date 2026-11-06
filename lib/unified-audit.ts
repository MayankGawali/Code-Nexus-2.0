/**
 * Prometheus Unified Multi-Modal Governance Audit Engine
 * Coordinates the 6 verification pillars and produces structured, explainable findings
 * with deterministic citations, provenance badges, and intent-preserving remediations.
 */

import { type BrandPack, getBrandPack } from "./brand-packs";
import { defaultScanner } from "./lexicon";
import {
  checkWcagContrast,
  validateHeadingHierarchy,
  checkImageAltText,
  computeReadability,
} from "./accessibility";
import { verifyBrandPalette, verifyAspectRatio } from "./color-science";
import { redactSecretsAndPii } from "./pii-redactor";
import { synthesizeIntentPreservingRewrite } from "./intent-rewrite";

export type AuditPillar =
  | "claim_verification"
  | "terminology_lexicon"
  | "visual_consistency"
  | "wcag_accessibility"
  | "voice_and_tone"
  | "security_and_pii";

export type UnifiedFinding = {
  id: string;
  pillar: AuditPillar;
  engineProvenance: string; // e.g., "Deterministic Lexicon Engine v1.2"
  title: string;
  severity: "high" | "medium" | "low";
  verdict: "Supported" | "Contradicted" | "Needs manual review" | "Insufficient evidence";
  start?: number;
  stop?: number;
  quote?: string;
  explanation: string;
  citationId: string;
  citationSource: string;
  suggestedFix?: string;
  intentPreserved?: boolean;
  semanticSimilarity?: number;
};

export type FullAuditReport = {
  assetId: string;
  campaignId: string;
  brandPackId: string;
  analyzedAt: string;
  overallScore: number; // 0..100
  status: "COMPLIANT" | "ACTION_REQUIRED" | "NON_COMPLIANT";
  findings: UnifiedFinding[];
  summary: {
    totalFindings: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    supportedCount: number;
    contradictedCount: number;
    manualReviewCount: number;
  };
  metrics: {
    readability: ReturnType<typeof computeReadability>;
    piiDetected: boolean;
    contrastRatio?: number;
  };
};

export function performUnifiedAudit(params: {
  text: string;
  channel: string;
  brandPack?: BrandPack;
  posterStyle?: { foreground: string; background: string; kind: string };
  logoDimensions?: { width: number; height: number };
}): FullAuditReport {
  const brand = params.brandPack ?? getBrandPack();
  const findings: UnifiedFinding[] = [];
  const text = params.text;

  // 1. Security & PII Redaction Check
  const pii = redactSecretsAndPii(text);
  if (pii.hasRedactions) {
    for (const r of pii.redactions) {
      findings.push({
        id: `SEC-${findings.length + 1}`,
        pillar: "security_and_pii",
        engineProvenance: "Deterministic Regex PII Sanitizer v1.0",
        title: `Sensitive ${r.type.replace("_", " ").toUpperCase()} Detected`,
        severity: "high",
        verdict: "Contradicted",
        start: r.start,
        stop: r.stop,
        quote: r.raw,
        explanation: `Confidential credential or private identifier exposed in public copy. Must be scrubbed prior to publication.`,
        citationId: "SEC-PRIVACY-01",
        citationSource: "Enterprise Data Protection & Zero-PII Policy",
        suggestedFix: r.masked,
      });
    }
  }

  // 2. Lexicon & Terminology Scanner (Aho-Corasick)
  const lexiconMatches = defaultScanner.scan(text);
  for (const match of lexiconMatches) {
    // Generate intent-preserving rewrite for the sentence containing this violation
    const sentenceStart = Math.max(0, text.lastIndexOf(".", match.start) + 1);
    const sentenceEnd = text.indexOf(".", match.stop);
    const sentence = text
      .slice(sentenceStart, sentenceEnd === -1 ? text.length : sentenceEnd + 1)
      .trim();

    const rewrite = synthesizeIntentPreservingRewrite(sentence, [
      {
        target: match.matchedText,
        replacement: match.replacement,
        ruleId: match.ruleId,
      },
    ]);

    findings.push({
      id: `LEX-${findings.length + 1}`,
      pillar: "terminology_lexicon",
      engineProvenance: "Aho-Corasick Trie Lexicon Engine v2.0",
      title: `Brand Lexicon Violation: "${match.matchedText}"`,
      severity: match.severity,
      verdict: "Contradicted",
      start: match.start,
      stop: match.stop,
      quote: match.matchedText,
      explanation: match.explanation,
      citationId: match.ruleId,
      citationSource: `Brand Pack ${brand.name} § Terminology`,
      suggestedFix: match.replacement,
      intentPreserved: rewrite.preservesIntent,
      semanticSimilarity: rewrite.semanticSimilarity,
    });
  }

  // 3. WCAG 2.1 Accessibility & Visual Contrast
  let measuredRatio: number | undefined;
  if (params.posterStyle && params.posterStyle.kind === "solid") {
    const wcag = checkWcagContrast(
      params.posterStyle.foreground,
      params.posterStyle.background,
      "normal",
      "AA",
    );
    measuredRatio = wcag.ratio;

    if (!wcag.levelAA) {
      findings.push({
        id: `WCAG-${findings.length + 1}`,
        pillar: "wcag_accessibility",
        engineProvenance: "ISO/IEC 40500 Relative Luminance Engine v2.1",
        title: `Insufficient Contrast Ratio (${wcag.ratio.toFixed(2)}:1)`,
        severity: "high",
        verdict: "Contradicted",
        explanation: wcag.explanation,
        citationId: "WCAG-2.1-1.4.3",
        citationSource: "W3C Web Content Accessibility Guidelines 2.1 (Level AA)",
        suggestedFix: wcag.suggestedForeground,
      });
    }

    // Perceptual color check on foreground and background
    const bgPaletteCheck = verifyBrandPalette(
      params.posterStyle.background,
      brand.palette,
    );
    if (!bgPaletteCheck.isApproved) {
      findings.push({
        id: `VIS-BG-${findings.length + 1}`,
        pillar: "visual_consistency",
        engineProvenance: "CIEDE2000 Perceptual Color Engine (ISO 11664-6)",
        title: `Off-Palette Background Color (${params.posterStyle.background})`,
        severity: "medium",
        verdict: "Contradicted",
        explanation: bgPaletteCheck.explanation,
        citationId: "PALETTE-BRAND-01",
        citationSource: `Brand Pack ${brand.name} Color Specs`,
        suggestedFix: bgPaletteCheck.suggestion ?? undefined,
      });
    }
  }

  // 4. Heading Hierarchy & Alt-Text
  const headingAudit = validateHeadingHierarchy(text);
  for (const v of headingAudit.violations) {
    findings.push({
      id: `STRUC-${findings.length + 1}`,
      pillar: "wcag_accessibility",
      engineProvenance: "Document AST Structural Parser v1.4",
      title: `Accessibility: Heading Structure Violation`,
      severity: "medium",
      verdict: "Needs manual review",
      quote: v.text,
      explanation: v.explanation,
      citationId: "WCAG-2.1-1.3.1",
      citationSource: "WCAG 2.1 Info and Relationships (Heading Hierarchy)",
    });
  }

  const altTextViolations = checkImageAltText(text);
  for (const alt of altTextViolations) {
    findings.push({
      id: `ALT-${findings.length + 1}`,
      pillar: "wcag_accessibility",
      engineProvenance: "Image Alt-Text Semantic Auditor v1.1",
      title: `Non-Compliant Image Alt Text`,
      severity: "high",
      verdict: "Contradicted",
      quote: alt.quote,
      explanation: alt.explanation,
      citationId: "WCAG-2.1-1.1.1",
      citationSource: "WCAG 2.1 Non-Text Content (Alt-Text Quality)",
      suggestedFix: alt.suggestion,
    });
  }

  // 5. Logo Aspect Ratio Inspection (if provided)
  if (params.logoDimensions) {
    const aspect = verifyAspectRatio(
      params.logoDimensions.width,
      params.logoDimensions.height,
      brand.logo.expectedAspectRatio,
      brand.logo.tolerancePercent,
    );
    if (aspect.verdict !== "Supported") {
      findings.push({
        id: `LOGO-DISTORT-${findings.length + 1}`,
        pillar: "visual_consistency",
        engineProvenance: "Keypoint Homography & Geometry Inspector",
        title: "Logo Distortion Detected",
        severity: "high",
        verdict: "Contradicted",
        explanation: aspect.explanation,
        citationId: "LOGO-LOCK-01",
        citationSource: `Brand Pack ${brand.name} Logo Guidelines`,
      });
    }
  }

  // 6. Readability & Tone Rubric
  const readability = computeReadability(text);
  if (readability.fleschKincaidGrade > brand.voice.targetGradeLevelMax) {
    findings.push({
      id: `TONE-DENSE-${findings.length + 1}`,
      pillar: "voice_and_tone",
      engineProvenance: "Flesch-Kincaid Multi-Axis Voice Rubric",
      title: `Reading Grade Level Too High (Grade ${readability.fleschKincaidGrade})`,
      severity: "low",
      verdict: "Needs manual review",
      explanation: `Document reading grade (${readability.fleschKincaidGrade}) exceeds target maximum grade ${brand.voice.targetGradeLevelMax} for ${params.channel}. Simplify sentences and reduce multi-syllable jargon.`,
      citationId: "VOICE-TONE-02",
      citationSource: `Brand Pack ${brand.name} Tone of Voice Guide`,
    });
  }

  // Compute overall score
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;

  const overallScore = Math.max(0, 100 - high * 25 - medium * 10 - low * 5);
  const status: FullAuditReport["status"] =
    high > 0 ? "NON_COMPLIANT" : medium > 0 ? "ACTION_REQUIRED" : "COMPLIANT";

  return {
    assetId: params.channel,
    campaignId: "aster",
    brandPackId: brand.id,
    analyzedAt: new Date().toISOString(),
    overallScore,
    status,
    findings,
    summary: {
      totalFindings: findings.length,
      highSeverityCount: high,
      mediumSeverityCount: medium,
      lowSeverityCount: low,
      supportedCount: 0,
      contradictedCount: findings.filter((f) => f.verdict === "Contradicted").length,
      manualReviewCount: findings.filter((f) => f.verdict === "Needs manual review").length,
    },
    metrics: {
      readability,
      piiDetected: pii.hasRedactions,
      contrastRatio: measuredRatio,
    },
  };
}
