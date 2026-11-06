/**
 * Prometheus Color Science & Perceptual Visual Consistency Engine
 * Implements CIE L*a*b* conversion, CIEDE2000 (ΔE₀₀) color difference formula,
 * palette compliance matching, and 64-bit DCT perceptual hashing (pHash).
 */

export type LabColor = { L: number; a: number; b: number };
export type RgbColor = { r: number; g: number; b: number };

export const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): RgbColor {
  let clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RgbColor): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Converts sRGB [0..255] to CIE XYZ using D65 reference white point
 */
export function rgbToXyz(rgb: RgbColor): { X: number; Y: number; Z: number } {
  // sRGB gamma expansion
  const pivot = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = pivot(rgb.r) * 100;
  const g = pivot(rgb.g) * 100;
  const b = pivot(rgb.b) * 100;

  // D65 standard illuminant matrix
  return {
    X: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    Y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    Z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

/**
 * Converts CIE XYZ to CIE L*a*b* with 2° observer and D65 reference white (95.047, 100.0, 108.883)
 */
export function xyzToLab(xyz: { X: number; Y: number; Z: number }): LabColor {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(xyz.X / refX);
  const fy = f(xyz.Y / refY);
  const fz = f(xyz.Z / refZ);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToLab(hex: string): LabColor {
  return xyzToLab(rgbToXyz(parseHex(hex)));
}

/**
 * CIEDE2000 (ΔE₀₀) color difference calculation
 * Standardized ISO/CIE 11664-6:2014 formula
 */
export function ciede2000(c1: LabColor, c2: LabColor): number {
  const rad2deg = (rad: number) => (rad * 180) / Math.PI;
  const deg2rad = (deg: number) => (deg * Math.PI) / 180;

  const c1C = Math.sqrt(c1.a * c1.a + c1.b * c1.b);
  const c2C = Math.sqrt(c2.a * c2.a + c2.b * c2.b);
  const avgC = (c1C + c2C) / 2;

  const G =
    0.5 *
    (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));

  const a1Prime = c1.a * (1 + G);
  const a2Prime = c2.a * (1 + G);

  const c1Prime = Math.sqrt(a1Prime * a1Prime + c1.b * c1.b);
  const c2Prime = Math.sqrt(a2Prime * a2Prime + c2.b * c2.b);

  const getHPrime = (a: number, b: number) => {
    if (a === 0 && b === 0) return 0;
    const h = rad2deg(Math.atan2(b, a));
    return h >= 0 ? h : h + 360;
  };

  const h1Prime = getHPrime(a1Prime, c1.b);
  const h2Prime = getHPrime(a2Prime, c2.b);

  const deltaLPrime = c2.L - c1.L;
  const deltaCPrime = c2Prime - c1Prime;

  let deltahPrime = 0;
  if (c1Prime * c2Prime !== 0) {
    const diff = h2Prime - h1Prime;
    if (Math.abs(diff) <= 180) {
      deltahPrime = diff;
    } else if (diff > 180) {
      deltahPrime = diff - 360;
    } else {
      deltahPrime = diff + 360;
    }
  }

  const deltaHPrime =
    2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deg2rad(deltahPrime / 2));

  const avgLPrime = (c1.L + c2.L) / 2;
  const avgCPrime = (c1Prime + c2Prime) / 2;

  let avgHPrime: number;
  if (c1Prime * c2Prime === 0) {
    avgHPrime = h1Prime + h2Prime;
  } else {
    const sum = h1Prime + h2Prime;
    if (Math.abs(h1Prime - h2Prime) <= 180) {
      avgHPrime = sum / 2;
    } else if (sum < 360) {
      avgHPrime = (sum + 360) / 2;
    } else {
      avgHPrime = (sum - 360) / 2;
    }
  }

  const T =
    1 -
    0.17 * Math.cos(deg2rad(avgHPrime - 30)) +
    0.24 * Math.cos(deg2rad(2 * avgHPrime)) +
    0.32 * Math.cos(deg2rad(3 * avgHPrime + 6)) -
    0.2 * Math.cos(deg2rad(4 * avgHPrime - 63));

  const deltaTheta =
    30 * Math.exp(-Math.pow((avgHPrime - 275) / 25, 2));

  const R_C =
    2 *
    Math.sqrt(
      Math.pow(avgCPrime, 7) / (Math.pow(avgCPrime, 7) + Math.pow(25, 7)),
    );

  const S_L =
    1 +
    (0.015 * Math.pow(avgLPrime - 50, 2)) /
      Math.sqrt(20 + Math.pow(avgLPrime - 50, 2));
  const S_C = 1 + 0.045 * avgCPrime;
  const S_H = 1 + 0.015 * avgCPrime * T;

  const R_T = -Math.sin(deg2rad(2 * deltaTheta)) * R_C;

  const termL = deltaLPrime / S_L;
  const termC = deltaCPrime / S_C;
  const termH = deltaHPrime / S_H;

  const deltaE00 = Math.sqrt(
    termL * termL +
      termC * termC +
      termH * termH +
      R_T * termC * termH,
  );

  return deltaE00;
}

export function deltaEHex(hex1: string, hex2: string): number {
  return ciede2000(hexToLab(hex1), hexToLab(hex2));
}

export type ApprovedBrandColor = {
  name: string;
  hex: string;
  usage: "primary" | "secondary" | "accent" | "neutral" | "background";
};

export type PaletteCheckResult = {
  testedHex: string;
  isApproved: boolean;
  minDeltaE: number;
  nearestApproved: ApprovedBrandColor;
  verdict: "Supported" | "Contradicted" | "Needs manual review";
  explanation: string;
  suggestion: string | null;
};

/**
 * Checks if a color conforms to the approved brand palette.
 * Colors with ΔE₀₀ <= 2.3 are imperceptible or just noticeable.
 * Colors with ΔE₀₀ <= 5.0 are considered within acceptable brand tolerance.
 * Colors with ΔE₀₀ > 5.0 are flagged as off-palette with the nearest approved token.
 */
export function verifyBrandPalette(
  hex: string,
  palette: ApprovedBrandColor[],
  toleranceDeltaE = 5.0,
): PaletteCheckResult {
  if (!HEX_REGEX.test(hex)) {
    return {
      testedHex: hex,
      isApproved: false,
      minDeltaE: Infinity,
      nearestApproved: palette[0],
      verdict: "Needs manual review",
      explanation: `Invalid hex color "${hex}". Expected format #RRGGBB.`,
      suggestion: palette[0]?.hex ?? null,
    };
  }

  const testLab = hexToLab(hex);
  let minDistance = Infinity;
  let closest = palette[0];

  for (const item of palette) {
    const dist = ciede2000(testLab, hexToLab(item.hex));
    if (dist < minDistance) {
      minDistance = dist;
      closest = item;
    }
  }

  const isExact = hex.toLowerCase() === closest.hex.toLowerCase();
  const isApproved = minDistance <= toleranceDeltaE;

  if (isExact) {
    return {
      testedHex: hex,
      isApproved: true,
      minDeltaE: 0,
      nearestApproved: closest,
      verdict: "Supported",
      explanation: `Matches approved brand color ${closest.name} (${closest.hex}) exactly.`,
      suggestion: null,
    };
  }

  if (isApproved) {
    return {
      testedHex: hex,
      isApproved: true,
      minDeltaE: minDistance,
      nearestApproved: closest,
      verdict: "Supported",
      explanation: `Color ${hex} is within acceptable brand perceptual tolerance (ΔE₀₀ = ${minDistance.toFixed(2)} ≤ ${toleranceDeltaE}) of ${closest.name} (${closest.hex}).`,
      suggestion: closest.hex,
    };
  }

  return {
    testedHex: hex,
    isApproved: false,
    minDeltaE: minDistance,
    nearestApproved: closest,
    verdict: "Contradicted",
    explanation: `Off-brand color ${hex} deviates perceptually (ΔE₀₀ = ${minDistance.toFixed(2)} > ${toleranceDeltaE}) from official palette. Closest approved match is ${closest.name} (${closest.hex}).`,
    suggestion: closest.hex,
  };
}

/**
 * Verifies logo aspect ratio consistency to catch stretching or squishing.
 */
export function verifyAspectRatio(
  measuredWidth: number,
  measuredHeight: number,
  expectedRatio: number, // width / height
  tolerancePercent = 3.0,
): {
  measuredRatio: number;
  expectedRatio: number;
  deviationPercent: number;
  verdict: "Supported" | "Contradicted";
  explanation: string;
} {
  if (measuredHeight <= 0 || measuredWidth <= 0) {
    throw new Error("Dimensions must be positive");
  }
  const measuredRatio = measuredWidth / measuredHeight;
  const deviationPercent =
    Math.abs(measuredRatio - expectedRatio) / expectedRatio * 100;

  const isSupported = deviationPercent <= tolerancePercent;
  return {
    measuredRatio,
    expectedRatio,
    deviationPercent,
    verdict: isSupported ? "Supported" : "Contradicted",
    explanation: isSupported
      ? `Logo aspect ratio ${measuredRatio.toFixed(3)} matches expected ${expectedRatio.toFixed(3)} within ${tolerancePercent}% tolerance.`
      : `Distorted logo: aspect ratio ${measuredRatio.toFixed(3)} deviates by ${deviationPercent.toFixed(1)}% from approved ${expectedRatio.toFixed(3)}. Aspect ratio must be locked.`,
  };
}

/**
 * Computes 64-bit DCT perceptual hash (pHash) representation from an 8x8 luminance matrix.
 * Used for perceptual asset matching and logo tamper verification.
 */
export function computeDctHash(matrix8x8: number[][]): string {
  if (matrix8x8.length !== 8 || matrix8x8.some((row) => row.length !== 8)) {
    throw new Error("Expected 8x8 matrix");
  }

  // 2D Discrete Cosine Transform (DCT-II)
  const dct: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
  const c = (i: number) => (i === 0 ? 1 / Math.sqrt(2) : 1);

  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          sum +=
            matrix8x8[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 16);
        }
      }
      dct[u][v] = 0.25 * c(u) * c(v) * sum;
    }
  }

  // Calculate median of low frequencies (excluding DC component at [0,0])
  const lowFreqs: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue;
      lowFreqs.push(dct[u][v]);
    }
  }
  lowFreqs.sort((a, b) => a - b);
  const median = lowFreqs[Math.floor(lowFreqs.length / 2)];

  // Form 64-bit binary hash
  let bits = "";
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      bits += dct[u][v] > median ? "1" : "0";
    }
  }

  // Convert 64 bits to 16-character hex string
  let hexStr = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = bits.slice(i, i + 4);
    hexStr += parseInt(nibble, 2).toString(16);
  }
  return hexStr;
}

/**
 * Hamming distance between two 64-bit hex perceptual hashes
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must have equal length");
  }
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    const n1 = parseInt(hash1[i], 16);
    const n2 = parseInt(hash2[i], 16);
    let xor = n1 ^ n2;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
