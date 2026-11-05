import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../lib/db";
import * as r from "../../../lib/review";
import { selectedDate } from "../../../lib/context";
import { CampaignNav, PageTitle } from "../../components";
import { Badge } from "../../fields";
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
        eyebrow="CAMPAIGN OVERVIEW"
        title={c.name}
        description="One launch. Every claim accounted for."
      >
        <div className="publication-stamp">
          <span className="mini-label">PLANNED PUBLICATION</span>
          <strong>{c.publication}</strong>
          <span>
            {approved} / {assets.length} assets approved
          </span>
        </div>
      </PageTitle>
      <CampaignNav id={id} active="Overview" />
      <section className={"next-step " + (attention ? "attention" : "")}>
        <div>
          <p className="eyebrow">
            {attention ? "NEXT IN YOUR QUEUE" : "READY FOR YOUR NEXT CHANGE"}
          </p>
          <h2>
            {attention
              ? attention.name + " needs your attention"
              : "All current assets are approved"}
          </h2>
          <p>
            {attention
              ? "Open the draft to resolve findings and approve its revision."
              : "Update an approved fact to preview which campaign assets need another review."}
          </p>
        </div>
        <Link
          className="button"
          href={attention ? base + "/" + attention.id : base + "/facts"}
        >
          {attention ? "Review next asset →" : "Manage approved facts →"}
        </Link>
      </section>
      <div className="section-heading">
        <h2>Campaign assets</h2>
        <span>
          {assets.length} assets · Status applies to each selected publication
          date
        </span>
      </div>
      {!assets.length && (
        <div className="card empty">
          No assets have been added to this campaign.
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
        <strong>How review works</strong>
        <p>
          Change a source → preview affected assets → correct the draft → run an
          audit → approve the new revision. Historical approvals stay in the
          evidence ledger.
        </p>
        <Link href={base + "/history"}>Explore revision history →</Link>
      </section>
    </>
  );
}
