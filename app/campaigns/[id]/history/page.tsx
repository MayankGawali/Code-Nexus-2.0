import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { history, provenance } from "../../../../lib/workflow";
import { visualFindings } from "../../../../lib/visual";
import { freshAudit } from "../../../../lib/context";
import { CampaignNav, PageTitle } from "../../../components";
import { History, recordedTime } from "../../../history";
import { Badge } from "../../../fields";
export const dynamic = "force-dynamic";
export default async function Ledger({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ asset?: string }>;
}) {
  const { id } = await params,
    query = await searchParams,
    db = database(),
    c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();
  const all = r.assets(db, id),
    list = query.asset ? all.filter((a) => a.id === query.asset) : all,
    events = history(db),
    base = "/campaigns/" + id;
  return (
    <>
      <Link className="breadcrumb" href={base}>
        ← {c.name}
      </Link>
      <PageTitle
        eyebrow="THE DECISION RECORD"
        title="Revision history"
        description="What changed, who reviewed it, and exactly which evidence they used."
      />
      <CampaignNav id={id} active="Revision history" />
      <div className="identity-note">
        DR · Review identity: <strong>Local demo reviewer</strong> · This is an
        explicitly labelled local demo identity.
      </div>
      <nav className="filter-links" aria-label="Filter history">
        <Link
          href={base + "/history"}
          aria-current={!query.asset ? "page" : undefined}
        >
          All assets
        </Link>
        {all.map((a) => (
          <Link
            href={base + "/history?asset=" + a.id}
            key={a.id}
            aria-current={query.asset === a.id ? "page" : undefined}
          >
            {a.name}
          </Link>
        ))}
      </nav>
      <div className="section-heading">
        <h2>Revision & evidence ledger</h2>
        <span>Newest revision first within each asset</span>
      </div>
      {!list.length && (
        <div className="empty card">
          No assets match this view.{" "}
          <Link href={base + "/history"}>Show all assets</Link>
        </div>
      )}
      {list.map((a) => (
        <section key={a.id} className="ledger-asset">
          <h2>
            <Link href={base + "/" + a.id}>{a.name} ↗</Link>
          </h2>
          {r.revisions(db, a.id).map((revision, i) => (
            <details
              className="ledger-revision card"
              key={revision.id}
              open={i === 0}
            >
              <summary>
                <span>
                  <strong>Revision R{revision.id}</strong>
                  <span className="quiet">{revision.body}</span>
                </span>
                <span className="version-label">
                  {i === 0 ? "Current" : "Historical"}
                </span>
              </summary>
              <div className="fact-content">
                <p className="quiet">
                  Saved by{" "}
                  {events.find(
                    (e) => e.kind === "revision" && e.entity === revision.id,
                  )?.actor ?? "Unrecorded legacy actor"}{" "}
                  ·{" "}
                  {recordedTime(
                    events.find(
                      (e) => e.kind === "revision" && e.entity === revision.id,
                    ),
                  )}
                </p>
                <blockquote>{revision.body}</blockquote>
                {r.audits(db, revision.id).length === 0 && (
                  <p>
                    No audit yet.{" "}
                    <Link href={base + "/" + a.id}>
                      Open the revision to run an audit.
                    </Link>
                  </p>
                )}
                {r.audits(db, revision.id).map((run) => {
                  const decision = r
                      .decisions(db, a.id)
                      .find((d) => d.audit === run.id),
                    comparison = r.compareRevision(db, run.id);
                  return (
                    <article className="ledger-audit" key={run.id}>
                      <h3>
                        Audit #{run.id} · Publication {run.publication}
                      </h3>
                      <p className="quiet">
                        Prometheus local verifier ·{" "}
                        {recordedTime(
                          events.find(
                            (e) => e.kind === "audit" && e.entity === run.id,
                          ),
                        )}{" "}
                        · {run.mode}
                      </p>
                      <p>
                        {freshAudit(db, run.id)
                          ? "Evidence context current"
                          : "Verifier or evidence context changed — historical result"}
                      </p>
                      {r.findings(db, run.id).map((f) => (
                        <div className="source-box" key={f.id}>
                          <Badge
                            value={
                              f.verdict ??
                              (f.supported
                                ? "Supported"
                                : "Insufficient evidence")
                            }
                          />
                          <blockquote>{f.quote}</blockquote>
                          <p>{f.explanation}</p>
                          <small>
                            UTF-16 [{f.start}, {f.stop})
                          </small>
                          {r.sources(db, f.id).map((v) => (
                            <div key={v.id}>
                              <strong>
                                {v.fact} / V{v.id}
                              </strong>
                              <blockquote>{v.wording}</blockquote>
                              <p>
                                Effective {v.start} → {v.until ?? "open-ended"}
                              </p>
                              {provenance(db, v.id) && (
                                <p>
                                  Source quote: {provenance(db, v.id).quote}
                                </p>
                              )}
                            </div>
                          ))}
                          {r
                            .overrides(db, run.id)
                            .filter((o) => o.finding === f.id)
                            .map((o) => (
                              <p key={o.id}>
                                Override #{o.id} · Local demo reviewer ·{" "}
                                {o.created} UTC · R{o.revision}: {o.reason}
                              </p>
                            ))}
                        </div>
                      ))}
                      {visualFindings(db, run.id).map((v) => (
                        <p key={v.id}>
                          Visual check · {v.element} · {v.verdict} ·{" "}
                          {v.ratio === null
                            ? "Unmeasurable"
                            : v.ratio.toFixed(2) + ":1"}{" "}
                          · {v.mode}
                        </p>
                      ))}
                      <details>
                        <summary>Compare with previous revision</summary>
                        {comparison.baseline ? (
                          <p>
                            Baseline: R{comparison.previous}, audit #
                            {comparison.baseline} for this date.
                          </p>
                        ) : (
                          <p>No previous revision audit for this date.</p>
                        )}
                        {comparison.changes.map((change) => (
                          <p key={change.position}>
                            Claim {change.position}:{" "}
                            {change.before?.quote ?? "No prior finding"} (
                            {change.before?.verdict ?? "—"}) →{" "}
                            {change.after?.quote ?? "Removed"} (
                            {change.after?.verdict ?? "—"})
                          </p>
                        ))}
                      </details>
                      {decision && (
                        <p className="approval-record">
                          <Badge value="Approved" /> Decision #{decision.id} ·{" "}
                          {events.find(
                            (e) =>
                              e.kind === "approval" && e.entity === decision.id,
                          )?.actor ?? "Unrecorded legacy actor"}{" "}
                          · {decision.created} UTC ·{" "}
                          {r.resolvedAudit(db, run.id)
                            ? "Evidence current"
                            : "Verifier or evidence changed — review required"}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      ))}
      <History events={events} />
    </>
  );
}
