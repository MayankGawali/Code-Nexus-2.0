import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as review from "../../../../lib/review";
import { act } from "../../../actions";
import { Badge, Hidden } from "../../../fields";
export const dynamic = "force-dynamic";
export default async function AssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; asset: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, asset } = await params,
    db = database(),
    c = review.campaigns(db).find((c) => c.id === id),
    a = review.assets(db, id).find((a) => a.id === asset);
  if (!c || !a) notFound();
  const path = "/campaigns/" + id,
    submit = act.bind(null, path + "/" + asset),
    revs = review.revisions(db, asset),
    latest = revs[0],
    decisions = review.decisions(db, asset),
    error = (await searchParams).error;
  return (
    <>
      <Link className="back" href={path}>
        ← {c.name}
      </Link>
      <p className="kicker">
        {a.channel.toUpperCase()} &nbsp; / &nbsp; ASSET REVIEW
      </p>
      <h1>{a.name}</h1>
      <p className="lead">
        {a.variant} &nbsp; <Badge value={review.status(db, asset)} />
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="section">
        <h2>Revision desk</h2>
        <small>CURRENT · R{latest.id}</small>
      </div>
      <div className="card panel">
        <p className="kicker">CURRENT COPY</p>
        <blockquote>{latest.body}</blockquote>
        <form action={submit}>
          <Hidden values={{ action: "audit", revision: latest.id }} />
          <label>
            Publication date
            <input
              name="day"
              type="date"
              defaultValue={c.publication}
              required
            />
          </label>
          <button>Run audit</button>
        </form>
        <details>
          <summary>Correct claim</summary>
          <form action={submit}>
            <Hidden
              values={{ action: "revise", id: asset, expected: latest.id }}
            />
            <label>
              Revised copy
              <textarea
                name="body"
                defaultValue={latest.body}
                required
                maxLength={4000}
              />
            </label>
            <button>Save revision</button>
          </form>
        </details>
      </div>
      <div className="section">
        <h2>Evidence ledger</h2>
        <small>NEWEST FIRST</small>
      </div>
      {revs.map((r) => (
        <section key={r.id} className="card panel">
          <h3>Revision R{r.id}</h3>
          <blockquote>{r.body}</blockquote>
          {review.audits(db, r.id).length === 0 && (
            <p>No audit yet. Choose a publication date and run an audit.</p>
          )}
          {review.audits(db, r.id).map((run) => {
            const claims = review.findings(db, run.id),
              decision = decisions.find((d) => d.audit === run.id),
              current = review.currentEvidence(db, run.id);
            return (
              <article key={run.id}>
                <small>
                  AUDIT #{run.id} &nbsp; / &nbsp; PUBLICATION {run.publication}
                </small>
                {!claims.length && <p>No auditable claims.</p>}
                {claims.map((f) => (
                  <div key={f.id} className="claim">
                    <strong>“{f.quote}”</strong>
                    <p>
                      Characters [{f.start}, {f.stop}) ·{" "}
                      {f.supported
                        ? "Supported at audit"
                        : "Unsupported: no exact approved wording for this variant and date."}
                    </p>
                    {review.sources(db, f.id).map((v) => (
                      <p className="source" key={v.id}>
                        ↳ {v.fact} / V{v.id} · “{v.wording}” · Valid {v.start}{" "}
                        to {v.until || "open"} (exclusive)
                      </p>
                    ))}
                  </div>
                ))}
                {decision ? (
                  <p>
                    <Badge value="Approved" /> &nbsp; Decision #{decision.id} ·{" "}
                    {decision.created} UTC ·{" "}
                    {current
                      ? "Evidence current"
                      : "Evidence changed — review required"}
                  </p>
                ) : r.id === latest.id && current ? (
                  <form action={submit}>
                    <Hidden values={{ action: "approve", audit: run.id }} />
                    <button>Approve revision</button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </>
  );
}
