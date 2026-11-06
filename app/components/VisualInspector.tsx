"use client";
import React, { useState } from "react";
import {
  hexToLab,
  verifyBrandPalette,
} from "../../lib/color-science";
import {
  checkWcagContrast,
  findAccessibleColor,
} from "../../lib/accessibility";
import { ASTER_WATCH_BRAND_PACK } from "../../lib/brand-packs";

export type VisualInspectorProps = {
  initialForeground?: string;
  initialBackground?: string;
  onApplyColors?: (fg: string, bg: string) => void;
};

export function VisualInspector({
  initialForeground = "#ffffff",
  initialBackground = "#173b34",
  onApplyColors,
}: VisualInspectorProps) {
  const [fg, setFg] = useState(initialForeground);
  const [bg, setBg] = useState(initialBackground);

  const brand = ASTER_WATCH_BRAND_PACK;
  const contrast = checkWcagContrast(fg, bg, "normal", "AA");
  const bgPaletteCheck = verifyBrandPalette(bg, brand.palette);
  const fgPaletteCheck = verifyBrandPalette(fg, brand.palette);

  const fgLab = hexToLab(fg);
  const bgLab = hexToLab(bg);

  function handleAutoFixContrast() {
    const accessibleFg = findAccessibleColor(fg, bg, 4.5);
    setFg(accessibleFg);
    if (onApplyColors) onApplyColors(accessibleFg, bg);
  }

  function handleSnapToBrand() {
    if (bgPaletteCheck.suggestion) {
      setBg(bgPaletteCheck.suggestion);
      if (onApplyColors) onApplyColors(fg, bgPaletteCheck.suggestion);
    }
  }

  return (
    <div className="visual-inspector-card">
      <div className="inspector-header">
        <div>
          <span className="mini-label">PILLAR 4 & 5: COMPUTER VISION & ACCESSIBILITY</span>
          <h3>Perceptual Color & WCAG 2.1 Contrast Engine</h3>
        </div>
        <div className="header-badges">
          <span className="provenance-badge">CIEDE2000 (ISO 11664-6)</span>
          <span className="provenance-badge">WCAG 2.1 AA</span>
        </div>
      </div>

      <div className="inspector-body">
        {/* Color pickers */}
        <div className="color-inputs-grid">
          <div className="color-input-box">
            <label className="input-label">Foreground (CTA Text)</label>
            <div className="picker-row">
              <input
                type="color"
                value={fg}
                onChange={(e) => {
                  setFg(e.target.value);
                  if (onApplyColors) onApplyColors(e.target.value, bg);
                }}
                className="native-color-picker"
                aria-label="Foreground color"
              />
              <input
                type="text"
                value={fg}
                onChange={(e) => {
                  setFg(e.target.value);
                  if (onApplyColors) onApplyColors(e.target.value, bg);
                }}
                className="hex-text-input"
                maxLength={7}
              />
            </div>
            <div className="color-metadata">
              <span className="coord-chip">
                CIE L*: {fgLab.L.toFixed(1)} a*: {fgLab.a.toFixed(1)} b*: {fgLab.b.toFixed(1)}
              </span>
              <span className={`status-chip ${fgPaletteCheck.isApproved ? "pass" : "fail"}`}>
                {fgPaletteCheck.isApproved ? "Approved Palette" : `ΔE₀₀ ${fgPaletteCheck.minDeltaE.toFixed(1)}`}
              </span>
            </div>
          </div>

          <div className="color-input-box">
            <label className="input-label">Background (Container / Poster)</label>
            <div className="picker-row">
              <input
                type="color"
                value={bg}
                onChange={(e) => {
                  setBg(e.target.value);
                  if (onApplyColors) onApplyColors(fg, e.target.value);
                }}
                className="native-color-picker"
                aria-label="Background color"
              />
              <input
                type="text"
                value={bg}
                onChange={(e) => {
                  setBg(e.target.value);
                  if (onApplyColors) onApplyColors(fg, e.target.value);
                }}
                className="hex-text-input"
                maxLength={7}
              />
            </div>
            <div className="color-metadata">
              <span className="coord-chip">
                CIE L*: {bgLab.L.toFixed(1)} a*: {bgLab.a.toFixed(1)} b*: {bgLab.b.toFixed(1)}
              </span>
              <span className={`status-chip ${bgPaletteCheck.isApproved ? "pass" : "fail"}`}>
                {bgPaletteCheck.isApproved ? "Approved Palette" : `ΔE₀₀ ${bgPaletteCheck.minDeltaE.toFixed(1)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Live CTA & Poster Preview with Measured Ratios */}
        <div className="preview-and-metrics-row">
          <div
            className="contrast-live-specimen"
            style={{ backgroundColor: bg, color: fg }}
          >
            <div className="specimen-badge">SAMPLE CTA BUTTON (16px)</div>
            <h4 style={{ color: fg, margin: "8px 0" }}>Explore Aster Watch</h4>
            <p style={{ color: fg, opacity: 0.9, fontSize: "13px", margin: 0 }}>
              Engineered with aerospace titanium and 24-hour battery life.
            </p>
          </div>

          <div className="contrast-meter-box">
            <div className="ratio-display">
              <span className="ratio-number">{contrast.ratio.toFixed(2)}:1</span>
              <span className="ratio-label">Measured Ratio</span>
            </div>

            <div className="level-indicators">
              <div className={`level-pill ${contrast.levelAA ? "pass" : "fail"}`}>
                <span className="pill-dot" />
                <span>WCAG 2.1 AA (4.5:1)</span>
                <strong>{contrast.levelAA ? "PASS" : "FAIL"}</strong>
              </div>
              <div className={`level-pill ${contrast.levelAAA ? "pass" : "fail"}`}>
                <span className="pill-dot" />
                <span>WCAG 2.1 AAA (7.0:1)</span>
                <strong>{contrast.levelAAA ? "PASS" : "FAIL"}</strong>
              </div>
            </div>

            <div className="inspector-actions">
              {!contrast.levelAA && (
                <button
                  type="button"
                  className="remediation-btn primary"
                  onClick={handleAutoFixContrast}
                >
                  ⚡ Auto-Synthesize Accessible Color
                </button>
              )}
              {!bgPaletteCheck.isApproved && bgPaletteCheck.suggestion && (
                <button
                  type="button"
                  className="remediation-btn secondary"
                  onClick={handleSnapToBrand}
                >
                  🎯 Snap to Nearest Brand Hex ({bgPaletteCheck.suggestion})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Approved Brand Palette Swatches */}
        <div className="brand-palette-section">
          <span className="mini-label">APPROVED BRAND TOKENS (ASTER WATCH)</span>
          <div className="palette-swatch-list">
            {brand.palette.map((color) => {
              const isSelected = bg.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.name}
                  type="button"
                  className={`palette-swatch-item ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setBg(color.hex);
                    if (onApplyColors) onApplyColors(fg, color.hex);
                  }}
                  title={`${color.name}: ${color.hex}`}
                >
                  <span
                    className="swatch-color-circle"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="swatch-name">{color.name}</span>
                  <span className="swatch-hex">{color.hex}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
