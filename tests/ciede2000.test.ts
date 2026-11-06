import { describe, it, expect } from "vitest";
import {
  parseHex,
  rgbToHex,
  hexToLab,
  ciede2000,
  deltaEHex,
  verifyBrandPalette,
  verifyAspectRatio,
  computeDctHash,
  hammingDistance,
} from "../lib/color-science";

describe("CIEDE2000 and Color Science Engine", () => {
  it("converts hex to RGB and back accurately", () => {
    const rgb = parseHex("#173b34");
    expect(rgb).toEqual({ r: 23, g: 59, b: 52 });
    expect(rgbToHex(rgb).toLowerCase()).toBe("#173b34");
  });

  it("calculates ΔE₀₀ = 0 for identical colors", () => {
    const lab = hexToLab("#173b34");
    expect(ciede2000(lab, lab)).toBe(0);
    expect(deltaEHex("#ffffff", "#ffffff")).toBe(0);
  });

  it("detects perceptible differences between distinct colors", () => {
    // Pure black vs pure white has massive ΔE00 ~100
    const dE = deltaEHex("#000000", "#ffffff");
    expect(dE).toBeGreaterThan(80);

    // Subtle dark green shift
    const subtle = deltaEHex("#173b34", "#1a3e37");
    expect(subtle).toBeLessThan(3.0);
  });

  it("verifies brand palette compliance within tolerance", () => {
    const palette = [
      { name: "Forest", hex: "#173b34", usage: "primary" as const },
      { name: "White", hex: "#ffffff", usage: "neutral" as const },
    ];

    const exact = verifyBrandPalette("#173b34", palette);
    expect(exact.isApproved).toBe(true);
    expect(exact.verdict).toBe("Supported");

    const offBrand = verifyBrandPalette("#ff0000", palette);
    expect(offBrand.isApproved).toBe(false);
    expect(offBrand.verdict).toBe("Contradicted");
    expect(offBrand.minDeltaE).toBeGreaterThan(5.0);
  });

  it("verifies logo aspect ratio and flags distortion", () => {
    // Expected ratio 3.5 (e.g. 350x100)
    const valid = verifyAspectRatio(350, 100, 3.5);
    expect(valid.verdict).toBe("Supported");

    // Stretched logo 400x100 (ratio 4.0 vs 3.5 -> 14% deviation)
    const distorted = verifyAspectRatio(400, 100, 3.5);
    expect(distorted.verdict).toBe("Contradicted");
    expect(distorted.deviationPercent).toBeGreaterThan(3.0);
  });

  it("computes 64-bit DCT perceptual hash and hamming distance", () => {
    const matrixA = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => r * 10 + c * 5),
    );
    const hashA = computeDctHash(matrixA);
    expect(hashA.length).toBe(16);

    const dist = hammingDistance(hashA, hashA);
    expect(dist).toBe(0);
  });
});

