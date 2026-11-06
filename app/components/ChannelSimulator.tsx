"use client";
import React, { useState } from "react";
import { checkWcagContrast } from "../../lib/accessibility";

export type ChannelSimulatorProps = {
  text: string;
  brandName?: string;
  posterColors?: { foreground: string; background: string };
};

export function ChannelSimulator({
  text,
  brandName,
  posterColors = { foreground: "#ffffff", background: "#173b34" },
}: ChannelSimulatorProps) {
  const brand = brandName?.trim() || "Aster Watch";
  const initials =
    brand
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EP";
  const [activeChannel, setActiveChannel] = useState<
    "email" | "social" | "web" | "poster"
  >("email");

  const contrast = checkWcagContrast(
    posterColors.foreground,
    posterColors.background,
  );

  return (
    <div className="channel-simulator-wrapper">
      <div className="simulator-nav-bar">
        <span className="mini-label">SIMULATE PUBLICATION CHANNEL:</span>
        <div className="channel-pill-group">
          <button
            type="button"
            className={`channel-pill ${activeChannel === "email" ? "active" : ""}`}
            onClick={() => setActiveChannel("email")}
          >
            ✉ Launch Email
          </button>
          <button
            type="button"
            className={`channel-pill ${activeChannel === "social" ? "active" : ""}`}
            onClick={() => setActiveChannel("social")}
          >
            📱 Social Media (X / LinkedIn)
          </button>
          <button
            type="button"
            className={`channel-pill ${activeChannel === "web" ? "active" : ""}`}
            onClick={() => setActiveChannel("web")}
          >
            🌐 Web Landing Hero
          </button>
          <button
            type="button"
            className={`channel-pill ${activeChannel === "poster" ? "active" : ""}`}
            onClick={() => setActiveChannel("poster")}
          >
            🖼 In-Store Retail Poster
          </button>
        </div>
      </div>

      <div className="simulator-canvas">
        {activeChannel === "email" && (
          <div className="email-preview-frame">
            <div className="email-window-header">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
              <span className="window-title">Prometheus Email Client • Preview</span>
            </div>
            <div className="email-headers">
              <div>
                <strong>From:</strong> {brand} Team &lt;announcements@enterprise.com&gt;
              </div>
              <div>
                <strong>To:</strong> Customer &lt;client@enterprise.com&gt;
              </div>
              <div>
                <strong>Subject:</strong> {brand} Official Announcement — Pre-Publication Release
              </div>
            </div>
            <div className="email-content-body">
              <div className="email-brand-logo">{brand.toUpperCase()}</div>
              <h2 className="email-hero-title">Verified release for {brand}.</h2>
              <div className="email-prose-text">{text}</div>
              <div className="email-cta-box">
                <button
                  type="button"
                  className="email-button"
                  style={{
                    backgroundColor: posterColors.background,
                    color: posterColors.foreground,
                  }}
                >
                  Discover {brand} →
                </button>
              </div>
              <div className="email-footer-legal">
                © {new Date().getFullYear()} {brand}. Verified with Prometheus Brand Governance Desk. Unsubscribe | Privacy.
              </div>
            </div>
          </div>
        )}

        {activeChannel === "social" && (
          <div className="social-preview-frame">
            <div className="social-post-card">
              <div className="social-user-row">
                <div className="social-avatar">{initials}</div>
                <div>
                  <div className="social-name">
                    <strong>{brand}</strong> <span className="verified-badge">✓</span>
                  </div>
                  <div className="social-handle">@{brand.replace(/\s+/g, "")}Official • 2h</div>
                </div>
              </div>
              <p className="social-body-text">{text}</p>
              <div
                className="social-media-banner"
                style={{
                  backgroundColor: posterColors.background,
                  color: posterColors.foreground,
                }}
              >
                <div className="banner-tag">OFFICIAL ANNOUNCEMENT</div>
                <h3>{brand} Enterprise Release</h3>
                <span className="banner-cta">Discover the specification →</span>
              </div>
              <div className="social-actions-bar">
                <span>💬 142</span>
                <span>🔁 894</span>
                <span>❤️ 4.2K</span>
                <span>📊 98K Views</span>
              </div>
            </div>
          </div>
        )}

        {activeChannel === "web" && (
          <div className="web-preview-frame">
            <div className="browser-mockup-bar">
              <span className="url-bar">https://enterprise.internal/{brand.toLowerCase().replace(/\s+/g, "-")}</span>
            </div>
            <div className="web-hero-content">
              <span className="web-tag">OFFICIAL CAMPAIGN SPECIFICATION</span>
              <h1 className="web-hero-headline">{brand}</h1>
              <p className="web-hero-lead">{text}</p>
              <div className="web-button-row">
                <button
                  type="button"
                  className="web-primary-btn"
                  style={{
                    backgroundColor: posterColors.background,
                    color: posterColors.foreground,
                  }}
                >
                  Explore {brand}
                </button>
                <button type="button" className="web-secondary-btn">
                  Compare Specs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeChannel === "poster" && (
          <div
            className="poster-preview-frame"
            style={{
              backgroundColor: posterColors.background,
              color: posterColors.foreground,
            }}
          >
            <div className="poster-inner">
              <div className="poster-logo-mark">{brand.toUpperCase()}</div>
              <h1 className="poster-title">DEFY LIMITS.</h1>
              <div className="poster-copy">{text}</div>
              <div className="poster-cta-wrapper">
                <div
                  className="poster-cta-block"
                  style={{
                    border: `2px solid ${posterColors.foreground}`,
                    color: posterColors.foreground,
                  }}
                >
                  AVAILABLE AT AUTHORIZED RETAILERS
                </div>
              </div>
              <div className="poster-compliance-tag">
                WCAG 2.1 Contrast: {contrast.ratio.toFixed(2)}:1 (
                {contrast.levelAA ? "PASSED" : "FAILED"})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

