import { describe, it, expect } from "vitest";
import {
  calculateContrastRatio,
  checkWcagContrast,
  validateHeadingHierarchy,
  checkImageAltText,
  computeReadability,
} from "../lib/accessibility";

describe("WCAG 2.1 Accessibility & Readability Engine", () => {
  it("calculates contrast ratios matching WCAG 2.1 specifications", () => {
    // Pure black on pure white is 21:1
    const max = calculateContrastRatio("#000000", "#ffffff");
    expect(max).toBeCloseTo(21.0, 1);

    // Forest green #173B34 on white #ffffff
    const forest = calculateContrastRatio("#173b34", "#ffffff");
    expect(forest).toBeGreaterThan(9.0);

    // Low contrast #777777 on #ffffff is ~4.48:1
    const grey = calculateContrastRatio("#777777", "#ffffff");
    expect(grey).toBeLessThan(4.5);
  });

  it("checks WCAG AA compliance and suggests accessible color", () => {
    const failedCheck = checkWcagContrast("#777777", "#ffffff", "normal", "AA");
    expect(failedCheck.levelAA).toBe(false);
    expect(failedCheck.verdict).toBe("Contradicted");
    expect(failedCheck.suggestedForeground).toBeDefined();

    // Suggested color must pass
    const suggestedRatio = calculateContrastRatio(
      failedCheck.suggestedForeground!,
      "#ffffff",
    );
    expect(suggestedRatio).toBeGreaterThanOrEqual(4.5);
  });

  it("validates heading hierarchy and flags skipped levels", () => {
    const invalidDoc = `
# Main Title
### Skipped Section Header
Some text
`;
    const audit = validateHeadingHierarchy(invalidDoc);
    expect(audit.isValid).toBe(false);
    expect(audit.violations.length).toBe(1);
    expect(audit.violations[0].expectedLevel).toBe(2);
  });

  it("detects missing or defective image alt-text", () => {
    const markdown = `
![](https://cdn.example.com/logo.png)
![image of watch](https://cdn.example.com/watch.png)
![Good descriptive alt text of Aster Watch](https://cdn.example.com/good.png)
`;
    const violations = checkImageAltText(markdown);
    expect(violations.length).toBe(2);
    expect(violations[0].issue).toBe("empty_alt");
    expect(violations[1].issue).toBe("redundant_phrase");
  });

  it("computes Flesch-Kincaid reading metrics", () => {
    const sample = "The cat sat on the mat. It was a sunny day.";
    const result = computeReadability(sample);
    expect(result.fleschReadingEase).toBeGreaterThan(80);
    expect(result.difficulty).toBe("Very Easy");
  });
});
