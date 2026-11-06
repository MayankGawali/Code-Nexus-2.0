import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { CampaignNav, PageTitle } from "../../../components";
import { getBrandPack } from "../../../../lib/brand-packs";
import { DEFAULT_BRAND_LEXICON_RULES } from "../../../../lib/lexicon";

export const dynamic = "force-dynamic";

export default async function BrandRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = database();
  const c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();

  const brand = getBrandPack();

  return (
    <>
      <Link className="breadcrumb" href={`/campaigns/${id}`}>
        ← Campaign desk
      </Link>
      <PageTitle
        eyebrow="BRAND PACK SPECIFICATIONS"
        title={`${brand.name} (v${brand.version})`}
        description="Active brand identity, voice guidelines, banned terminology trie, and perceptual color tokens."
      >
        <div className="publication-stamp">
          <span className="mini-label">EFFECTIVE DATE</span>
          <strong>{brand.effectiveDate}</strong>
          <span>Deterministic Governance Active</span>
        </div>
      </PageTitle>

      <CampaignNav
        id={id}
        active="Brand Pack & Rules"
        firstAsset={r.assets(db, id)[0]?.id}
      />

      <div className="rules-page-layout">
        {/* Visual Palette Section */}
        <section className="rules-section-card">
          <div className="section-head">
            <span className="mini-label">PILLAR 4: PERCEPTUAL COLOR PALETTE</span>
            <h3>Approved Color Tokens (CIEDE2000 ΔE₀₀ ≤ 5.0)</h3>
            <p className="section-sub">
              Perceptual color distance is verified in CIE L*a*b* color space. Any off-palette shade exceeding 5.0 ΔE₀₀ is flagged.
            </p>
          </div>
          <div className="color-tokens-grid">
            {brand.palette.map((item) => (
              <div key={item.name} className="color-token-card">
                <div
                  className="token-swatch"
                  style={{ backgroundColor: item.hex }}
                />
                <div className="token-info">
                  <strong>{item.name}</strong>
                  <code>{item.hex}</code>
                  <span className="token-role">{item.usage.toUpperCase()}</span>
                  <small className="lab-coords">
                    L*: {item.lab.L.toFixed(1)} a*: {item.lab.a.toFixed(1)} b*: {item.lab.b.toFixed(1)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Terminology & Banned Buzzwords */}
        <section className="rules-section-card">
          <div className="section-head">
            <span className="mini-label">PILLAR 2: AHO-CORASICK LEXICON RULES</span>
            <h3>Forbidden Buzzwords & Required Trademark Casing</h3>
            <p className="section-sub">
              Sub-millisecond trie dictionary scanning against unverified promotional claims and trademark drift.
            </p>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Category</th>
                  <th>Flagged Pattern</th>
                  <th>Compliant Replacement</th>
                  <th>Severity</th>
                  <th>Guideline Policy</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_BRAND_LEXICON_RULES.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <code>{rule.id}</code>
                    </td>
                    <td>
                      <span className="category-chip">
                        {rule.category.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="flagged-term-pill">“{rule.pattern}”</span>
                    </td>
                    <td>
                      <span className="replacement-term-pill">
                        → “{rule.replacement}”
                      </span>
                    </td>
                    <td>
                      <span className={`sev-badge sev-${rule.severity}`}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="rule-explanation-cell">{rule.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Brand Voice & Tone Rubrics */}
        <section className="rules-section-card">
          <div className="section-head">
            <span className="mini-label">PILLAR 3: BRAND VOICE & READABILITY</span>
            <h3>Multi-Axis Brand Voice Rubric</h3>
          </div>
          <div className="rubric-metrics-grid">
            <div className="rubric-stat-box">
              <span className="rubric-num">{brand.voice.targetTone.replace("_", " ").toUpperCase()}</span>
              <span className="rubric-lbl">Target Brand Voice Tone</span>
            </div>
            <div className="rubric-stat-box">
              <span className="rubric-num">≤ {brand.voice.maxSuperlativesPer100Words}</span>
              <span className="rubric-lbl">Max Superlatives / 100 Words</span>
            </div>
            <div className="rubric-stat-box">
              <span className="rubric-num">≥ {brand.voice.targetFleschReadingEaseMin}</span>
              <span className="rubric-lbl">Min Flesch Reading Ease</span>
            </div>
            <div className="rubric-stat-box">
              <span className="rubric-num">Grade ≤ {brand.voice.targetGradeLevelMax}</span>
              <span className="rubric-lbl">Target Grade Level (US K-12)</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
