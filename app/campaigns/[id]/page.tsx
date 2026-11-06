import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../lib/db";
import * as r from "../../../lib/review";
import { selectedDate } from "../../../lib/context";
import { CampaignNav, PageTitle } from "../../components";
import { Badge, Hidden } from "../../fields";
import { Form, Submit } from "../../form";

export const dynamic = "force-dynamic";

export default async function Campaign({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    db = database(),
    c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();

  const assets = r.assets(db, id),
    attention = assets.find((a) => r.status(db, a.id) !== "Approved"),
    approved = assets.filter((a) => r.status(db, a.id) === "Approved").length,
    base = "/campaigns/" + id;

  return (
    <>
      <Link className="breadcrumb" href="/">
        ← Campaign desk
      </Link>
      <PageTitle
        eyebrow="ENTERPRISE CAMPAIGN DESK"
        title={c.name}
        description="Unified pre-publication governance: every assertion verified, every color tested, zero compliance liabilities."
      >
        <div className="publication-stamp">
          <span className="mini-label">PLANNED RELEASE DATE</span>
          <strong>{c.publication}</strong>
          <span>
            {approved} / {assets.length} assets approved
          </span>
        </div>
      </PageTitle>

      <CampaignNav id={id} active="Overview" firstAsset={assets[0]?.id} />

      {assets.length === 0 ? (
        <section className="next-step attention">
          <div>
            <p className="eyebrow">NEW CAMPAIGN CREATED</p>
            <h2>Add your first marketing or product asset</h2>
            <p>
              Your company workspace is ready. Add your first asset below to run real-time pre-flight checks, brand color tests, and claim verification.
            </p>
          </div>
        </section>
      ) : (
        <section className={"next-step " + (attention ? "attention" : "")}>
          <div>
            <p className="eyebrow">
              {attention ? "PENDING REVIEW" : "PRODUCTION RELEASE READY"}
            </p>
            <h2>
              {attention
                ? attention.name + " requires pre-publication sign-off"
                : "All current assets are approved for publication"}
            </h2>
            <p>
              {attention
                ? "Open the review studio to inspect findings, test contrast, and record approvals."
                : "All assertions match approved sources. Export your pre-publication certificate or add new assets."}
            </p>
          </div>
          <Link
            className="button"
            href={attention ? base + "/" + attention.id : base + "/certificate"}
          >
            {attention ? "Review next asset →" : "View Audit Certificate →"}
          </Link>
        </section>
      )}

      {/* Add New Asset Form */}
      <details
        className="card"
        open={assets.length === 0}
        style={{ marginBottom: "24px", padding: "16px" }}
      >
        <summary style={{ cursor: "pointer", fontWeight: "700", color: "#1e40af" }}>
          ➕ Add an Asset to this Campaign (Web, Email, Social, Print, Document)
        </summary>
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
          <Form path={base} className="stack">
            <Hidden values={{ action: "create_asset", campaign: id }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <label>
                Asset Title
                <input
                  name="name"
                  placeholder="e.g. Launch Press Release"
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Asset Slug ID
                <input
                  name="id"
                  placeholder="e.g. press-release-q4"
                  required
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="Alphanumeric and hyphens only"
                  maxLength={40}
                />
              </label>
              <label>
                Publication Channel
                <select name="channel" defaultValue="Web">
                  <option value="Web">Web Product Page</option>
                  <option value="Email">Marketing Email</option>
                  <option value="Social">Social Media Ad</option>
                  <option value="Print">Print / Retail Poster</option>
                  <option value="Document">Press Release / PDF</option>
                </select>
              </label>
              <label>
                Target Variant / Scope
                <input
                  name="variant"
                  defaultValue={c.name}
                  required
                  maxLength={80}
                />
              </label>
            </div>
            <label style={{ marginTop: "10px" }}>
              Initial Copy / Draft Content
              <textarea
                name="body"
                placeholder="Enter initial marketing copy or statements to be verified..."
                required
                rows={4}
                maxLength={4000}
              />
            </label>
            <div style={{ marginTop: "10px" }}>
              <Submit>Save Asset & Open Review Studio →</Submit>
            </div>
          </Form>
        </div>
      </details>

      <div className="section-heading">
        <h2>Campaign assets</h2>
        <span>
          {assets.length} {assets.length === 1 ? "asset" : "assets"} · Status applies to selected publication date
        </span>
      </div>

      {!assets.length && (
        <div className="card empty">
          No assets have been added to this campaign yet. Use the form above to add an asset.
        </div>
      )}

      <div className="asset-list">
        {assets.map((a) => {
          const rev = r.revisions(db, a.id)[0],
            day = selectedDate(db, a.id),
            audits = rev ? r.audits(db, rev.id) : [];
          return (
            <Link
              className="asset-row card"
              href={base + "/" + a.id}
              key={a.id}
            >
              <span
                className={
                  "asset-icon " + (a.channel === "Print" ? "poster-icon" : "")
                }
                aria-hidden="true"
              >
                {a.channel === "Print"
                  ? "▧"
                  : a.channel === "Email"
                    ? "✉"
                    : a.channel === "Social"
                      ? "📱"
                      : "▤"}
              </span>
              <div className="asset-row-main">
                <span className="mini-label">
                  {a.channel} · {a.variant}
                </span>
                <h3>{a.name}</h3>
                <p>{rev?.body ?? "No revision yet"}</p>
              </div>
              <div className="asset-row-meta">
                <Badge value={r.status(db, a.id)} />
                <small>Publication {day}</small>
                <small>
                  R{rev?.id ?? "—"} · {audits.length} recorded{" "}
                  {audits.length === 1 ? "audit" : "audits"}
                </small>
              </div>
              <span className="row-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          );
        })}
      </div>

      <section className="help-strip">
        <strong>Pre-Publication Workflow</strong>
        <p>
          Register approved facts → preview dependencies → audit draft → apply 1-click intent-preserving rewrites → sign off with cryptographic certificate.
        </p>
        <Link href={base + "/history"}>Explore revision history →</Link>
      </section>
    </>
  );
}
