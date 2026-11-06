/**
 * Prometheus Versioned Brand Packs
 * Defines complete enterprise brand guidelines for multi-tenant / multi-campaign governance.
 */

import { hexToLab, type ApprovedBrandColor, type LabColor } from "./color-science";
import { DEFAULT_BRAND_LEXICON_RULES, type LexiconRule } from "./lexicon";

export type BrandPack = {
  id: string;
  name: string;
  version: string;
  effectiveDate: string;
  description: string;
  palette: (ApprovedBrandColor & { lab: LabColor })[];
  logo: {
    expectedAspectRatio: number; // width / height
    tolerancePercent: number;
    approvedPHash: string;
  };
  voice: {
    targetTone: "authoritative_technical" | "premium_lifestyle" | "conversational_b2b";
    maxSuperlativesPer100Words: number;
    targetFleschReadingEaseMin: number;
    targetGradeLevelMax: number;
  };
  lexiconRules: LexiconRule[];
  wcag: {
    contrastNormal: number;
    contrastLarge: number;
    requireAltText: boolean;
    enforceHeadingHierarchy: boolean;
  };
};

export const ASTER_WATCH_BRAND_PACK: BrandPack = {
  id: "aster-watch-v2",
  name: "Aster Watch Brand Identity & Tone Pack",
  version: "2.4.0",
  effectiveDate: "2026-01-01",
  description: "Official design, terminology, and legal assurance pack for Aster Watch hardware lines.",
  palette: [
    {
      name: "Deep Forest",
      hex: "#173B34",
      usage: "primary",
      lab: hexToLab("#173B34"),
    },
    {
      name: "Starlight White",
      hex: "#FFFFFF",
      usage: "neutral",
      lab: hexToLab("#FFFFFF"),
    },
    {
      name: "Space Black",
      hex: "#111827",
      usage: "neutral",
      lab: hexToLab("#111827"),
    },
    {
      name: "Titanium Silver",
      hex: "#94A3B8",
      usage: "secondary",
      lab: hexToLab("#94A3B8"),
    },
    {
      name: "Trail Amber",
      hex: "#D97706",
      usage: "accent",
      lab: hexToLab("#D97706"),
    },
  ],
  logo: {
    expectedAspectRatio: 3.5, // 350x100 horizontal logo lockup
    tolerancePercent: 2.5,
    approvedPHash: "c18f3a9e2d7b4c60",
  },
  voice: {
    targetTone: "premium_lifestyle",
    maxSuperlativesPer100Words: 1,
    targetFleschReadingEaseMin: 55,
    targetGradeLevelMax: 9,
  },
  lexiconRules: DEFAULT_BRAND_LEXICON_RULES,
  wcag: {
    contrastNormal: 4.5,
    contrastLarge: 3.0,
    requireAltText: true,
    enforceHeadingHierarchy: true,
  },
};

export const INKLOOM_AI_BRAND_PACK: BrandPack = {
  id: "inkloom-enterprise-v1",
  name: "Inkloom AI Enterprise Governance Pack",
  version: "1.2.0",
  effectiveDate: "2026-03-01",
  description: "Enterprise SaaS brand governance pack for Inkloom AI multi-modal products.",
  palette: [
    {
      name: "Inkloom Indigo",
      hex: "#2563EB",
      usage: "primary",
      lab: hexToLab("#2563EB"),
    },
    {
      name: "Deep Obsidian",
      hex: "#0F172A",
      usage: "neutral",
      lab: hexToLab("#0F172A"),
    },
    {
      name: "Clean Slate",
      hex: "#F8FAFC",
      usage: "background",
      lab: hexToLab("#F8FAFC"),
    },
    {
      name: "Cyber Violet",
      hex: "#7C3AED",
      usage: "accent",
      lab: hexToLab("#7C3AED"),
    },
  ],
  logo: {
    expectedAspectRatio: 4.0,
    tolerancePercent: 2.0,
    approvedPHash: "e82b7194f03d5ca1",
  },
  voice: {
    targetTone: "authoritative_technical",
    maxSuperlativesPer100Words: 0,
    targetFleschReadingEaseMin: 45,
    targetGradeLevelMax: 12,
  },
  lexiconRules: DEFAULT_BRAND_LEXICON_RULES,
  wcag: {
    contrastNormal: 4.5,
    contrastLarge: 3.0,
    requireAltText: true,
    enforceHeadingHierarchy: true,
  },
};

export const BRAND_PACKS = [ASTER_WATCH_BRAND_PACK, INKLOOM_AI_BRAND_PACK];

export function getBrandPack(id = "aster-watch-v2"): BrandPack {
  return BRAND_PACKS.find((b) => b.id === id) ?? ASTER_WATCH_BRAND_PACK;
}

