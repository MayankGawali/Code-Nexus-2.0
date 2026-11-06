/**
 * Prometheus WCAG 2.1 Accessibility & Content Readability Engine
 * Enforces ISO/IEC 40500:2012 / WCAG 2.1 AA & AAA standards, relative luminance math,
 * automated accessible color synthesis, heading hierarchy validation, and Flesch-Kincaid readability.
 */

import { parseHex, rgbToHex, type RgbColor } from "./color-science";

export type WcagLevel = "AA" | "AAA";
export type TextSize = "normal" | "large";

/**
 * Calculates WCAG 2.1 relative luminance (L) of an sRGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are gamma-expanded.
 */
export function calculateLuminance(hexColor: string): number {
  const rgb = parseHex(hexColor);
  const channels = [rgb.r, rgb.g, rgb.b]
    .map((c) => c / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors:
 * (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = calculateLuminance(fgHex);
  const l2 = calculateLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagCheckResult = {
  foreground: string;
  background: string;
  ratio: number;
  levelAA: boolean;
  levelAAA: boolean;
  requiredRatio: number;
  verdict: "Supported" | "Contradicted";
  explanation: string;
  suggestedForeground?: string;
  suggestedBackground?: string;
};

export function checkWcagContrast(
  fgHex: string,
  bgHex: string,
  textSize: TextSize = "normal",
  targetLevel: WcagLevel = "AA",
): WcagCheckResult {
  const ratio = calculateContrastRatio(fgHex, bgHex);
  const requiredRatio =
    targetLevel === "AAA"
      ? textSize === "normal"
        ? 7.0
        : 4.5
      : textSize === "normal"
        ? 4.5
        : 3.0;

  const passes = ratio >= requiredRatio;
  const levelAA =
    textSize === "normal" ? ratio >= 4.5 : ratio >= 3.0;
  const levelAAA =
    textSize === "normal" ? ratio >= 7.0 : ratio >= 4.5;

  let suggestedForeground: string | undefined;
  if (!passes) {
    suggestedForeground = findAccessibleColor(fgHex, bgHex, requiredRatio);
  }

  return {
    foreground: fgHex,
    background: bgHex,
    ratio,
    levelAA,
    levelAAA,
    requiredRatio,
    verdict: passes ? "Supported" : "Contradicted",
    explanation: passes
      ? `Contrast ratio ${ratio.toFixed(2)}:1 passes WCAG 2.1 ${targetLevel} requirements (min ${requiredRatio}:1) for ${textSize} text.`
      : `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG 2.1 ${targetLevel} requirement of ${requiredRatio}:1 for ${textSize} text. Suggest adjusting foreground to ${suggestedForeground}.`,
    suggestedForeground,
  };
}

/**
 * Synthesizes an adjusted foreground color that meets the required contrast ratio
 * while minimizing perceptual hue shift.
 */
export function findAccessibleColor(
  fgHex: string,
  bgHex: string,
  targetRatio = 4.5,
): string {
  const bgL = calculateLuminance(bgHex);
  const rgb = parseHex(fgHex);

  // Decide whether to lighten or darken based on background luminance
  const shouldLighten = bgL < 0.5;

  // Search along the lightness scale [0..255]
  for (let step = 0; step <= 255; step += 1) {
    const factor = shouldLighten ? 1 + step / 255 : 1 - step / 255;
    const adjustedRgb: RgbColor = {
      r: Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(rgb.b * factor))),
    };
    const candidateHex = rgbToHex(adjustedRgb);
    const cr = calculateContrastRatio(candidateHex, bgHex);
    if (cr >= targetRatio) {
      return candidateHex;
    }
  }

  // Fallback to pure white or pure black
  return shouldLighten ? "#ffffff" : "#000000";
}

/**
 * Heading hierarchy validator
 * Checks that headings follow a proper descending hierarchy without skipping levels (e.g. H1 -> H3).
 */
export type HeadingViolation = {
  line: number;
  text: string;
  level: number;
  expectedLevel: number;
  explanation: string;
};

export function validateHeadingHierarchy(markdown: string): {
  isValid: boolean;
  headings: { level: number; text: string; line: number }[];
  violations: HeadingViolation[];
} {
  const lines = markdown.split(/\r?\n/);
  const headings: { level: number; text: string; line: number }[] = [];
  const violations: HeadingViolation[] = [];

  let h1Count = 0;
  let prevLevel = 0;

  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const lineNum = idx + 1;

      headings.push({ level, text, line: lineNum });

      if (level === 1) {
        h1Count++;
        if (h1Count > 1) {
          violations.push({
            line: lineNum,
            text,
            level,
            expectedLevel: 2,
            explanation: `Multiple top-level H1 headings detected ("${text}"). Documents should have a single unique H1 title for screen reader accessibility.`,
          });
        }
      }

      if (prevLevel > 0 && level > prevLevel + 1) {
        violations.push({
          line: lineNum,
          text,
          level,
          expectedLevel: prevLevel + 1,
          explanation: `Skipped heading level: jumped from H${prevLevel} to H${level} without an intermediate H${prevLevel + 1}. Breaks assistive technology navigation order.`,
        });
      }

      prevLevel = level;
    }
  });

  return {
    isValid: violations.length === 0,
    headings,
    violations,
  };
}

/**
 * Image Alt-Text Accessibility Checker
 * Validates alt attributes for markdown images ![alt](url)
 */
export type AltTextViolation = {
  quote: string;
  altText: string;
  url: string;
  issue: "missing_alt" | "empty_alt" | "redundant_phrase" | "insufficient_detail";
  explanation: string;
  suggestion: string;
};

export function checkImageAltText(markdown: string): AltTextViolation[] {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const violations: AltTextViolation[] = [];

  let match;
  while ((match = imgRegex.exec(markdown)) !== null) {
    const full = match[0];
    const alt = match[1].trim();
    const url = match[2].trim();

    if (alt.length === 0) {
      violations.push({
        quote: full,
        altText: alt,
        url,
        issue: "empty_alt",
        explanation: "Image has empty alt text. Screen readers will skip this or announce the filename.",
        suggestion: `![Descriptive caption of ${url.split("/").pop() ?? "image"}](${url})`,
      });
    } else if (/^(image of|photo of|picture of|icon of)\b/i.test(alt)) {
      violations.push({
        quote: full,
        altText: alt,
        url,
        issue: "redundant_phrase",
        explanation: `Alt text starts with redundant phrase "${alt.slice(0, 10)}...". Screen readers already announce the image element.`,
        suggestion: `![${alt.replace(/^(image of|photo of|picture of|icon of)\s+/i, "")}](${url})`,
      });
    } else if (alt.length < 5) {
      violations.push({
        quote: full,
        altText: alt,
        url,
        issue: "insufficient_detail",
        explanation: `Alt text "${alt}" is too brief (< 5 characters) to provide meaningful context for visually impaired users.`,
        suggestion: `![Detailed description of visual content](${url})`,
      });
    }
  }

  return violations;
}

/**
 * Computes Flesch-Kincaid Reading Ease and Grade Level
 */
export function computeReadability(text: string): {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  difficulty: "Very Easy" | "Standard" | "Fairly Difficult" | "Difficult";
  sentences: number;
  words: number;
  syllables: number;
} {
  const sentenceList = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const wordList = text
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const sentences = Math.max(1, sentenceList.length);
  const words = Math.max(1, wordList.length);

  const countSyllables = (word: string) => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
    word = word.replace(/^y/, "");
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const syllables = wordList.reduce((acc, w) => acc + countSyllables(w), 0);

  // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const fleschReadingEase = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words),
      ),
    ),
  );

  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const fleschKincaidGrade = Math.round(
    Math.max(
      1,
      0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59,
    ),
  );

  const difficulty =
    fleschReadingEase >= 80
      ? "Very Easy"
      : fleschReadingEase >= 60
        ? "Standard"
        : fleschReadingEase >= 40
          ? "Fairly Difficult"
          : "Difficult";

  return {
    fleschReadingEase,
    fleschKincaidGrade,
    difficulty,
    sentences,
    words,
    syllables,
  };
}
