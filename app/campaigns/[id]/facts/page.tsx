import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { previews, provenance } from "../../../../lib/workflow";
import { CampaignNav, PageTitle } from "../../../components";
import { Form, Submit } from "../../../form";
import { Hidden } from "../../../fields";
export const dynamic = "force-dynamic";
export default async function Registry({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params,
    query = await searchParams,
    db = database(),
    c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();
  const path = "/campaigns/" + id + "/facts",
    list = r.facts(db),
    preview = query.preview ? previews(db, query.preview) : null;
  return (
    <>
      <Link className="breadcrumb" href={"/campaigns/" + id}>
        ← {c.name}
      </Link>
      <PageTitle
        eyebrow="SOURCE OF TRUTH"
        title="Fact registry"
        description="Approved wording, with a version and a reason behind every change."
      />
      <CampaignNav
        id={id}
        active="Fact registry"
        firstAsset={r.assets(db, id)[0]?.id}
      />
      <div className="registry-layout">
        <section>
          {preview && (
            <section className="impact-panel card" aria-label="Impact preview">
              <span className="mini-label">BEFORE YOU PUBLISH</span>
              <h2>Impact preview</h2>
              {preview.kind === "fact" && (
                <p>
                  New fact: {preview.variant} / {preview.label}
                </p>
              )}
              <blockquote>{preview.wording}</blockquote>
              <p>
                Effective {preview.start} · Earlier publication dates retain
                their original evidence.
              </p>
              <details>
                <summary>Source quote and reason</summary>
                <blockquote>{preview.quote}</blockquote>
                <p>{preview.reason}</p>
              </details>
              <div className="impact-list">
                {preview.impact.length === 0 && (
                  <p className="empty">
                    No current assets depend on this product and metric.
                  </p>
                )}
                {preview.impact.map((a) => (
                  <div className="impact-row" key={a.asset}>
                    <Link href={"/campaigns/" + id + "/" + a.asset}>
                      {a.name} ↗
                    </Link>
                    <small>
                      R{a.revision} · Publication {a.publication}
                    </small>
                    <p>
                      {a.before.join(", ")} →{" "}
                      <strong>{a.after.join(", ")}</strong>
                    </p>
                    <span className="quiet">
                      {a.changed ? "Will re-audit" : "Evidence unchanged"} ·{" "}
                      {a.dependency
                        ? "Existing fact dependency"
                        : "Reconsider same product and metric"}
                    </span>
                  </div>
                ))}
              </div>
              <Form path={path}>
                <Hidden values={{ action: "publish", preview: preview.id }} />
                <Submit>Publish version</Submit>
                <Link className="text-link" href={path}>
                  Cancel preview
                </Link>
              </Form>
            </section>
          )}
          <div className="section-heading">
            <h2>Approved facts</h2>
            <span>{list.length} records</span>
          </div>
          {!list.length && (
            <div className="empty card">
              No approved facts yet. Add a fact to begin.
            </div>
          )}
          {list.map((f) => {
            const history = r.versions(db, f.id),
              latest = history[0];
            return (
              <details className="fact-record card" key={f.id}>
                <summary>
                  <span>
                    <span className="mini-label">{f.variant}</span>
                    <strong>{f.label}</strong>
                    <span className="fact-wording">
                      {latest?.wording ?? "No version recorded"}
                    </span>
                  </span>
                  <span className="version-label">
                    {history.length}{" "}
                    {history.length === 1 ? "version" : "versions"}
                  </span>
                </summary>
                <div className="fact-content">
                  <h3>Version history</h3>
                  {history.map((v) => {
                    const source = provenance(db, v.id);
                    return (
                      <div key={v.id} className="source-box">
                        <span className="mini-label">FACT VERSION {v.id}</span>
                        <blockquote>{v.wording}</blockquote>
                        <p>
                          Effective {v.start} → {v.until ?? "open-ended"}
                          {v.until ? " (end exclusive)" : ""}
                        </p>
                        {source ? (
                          <>
                            <details>
                              <summary>Source quote</summary>
                              <blockquote>{source.quote}</blockquote>
                            </details>
                            <p>Reason: {source.reason}</p>
                            <small>
                              {source.created} UTC · Local demo reviewer
                            </small>
                          </>
                        ) : (
                          <small>
                            Seeded approved fact · source wording shown above
                          </small>
                        )}
                      </div>
                    );
                  })}
                  {latest && (
                    <>
                      <h3>Add a fact version</h3>
                      <p className="quiet">
                        The current version closes atomically when its successor
                        starts. Preview the impact before publishing.
                      </p>
                      <Form path={path} className="stack">
                        <Hidden
                          values={{
                            action: "preview",
                            id: f.id,
                            expected: latest.id,
                          }}
                        />
                        <label>
                          New approved wording
                          <input
                            name="word"
                            required
                            maxLength={240}
                            placeholder="up to 18 hours in standard mode"
                          />
                        </label>
                        <label>
                          Effective from
                          <input
                            name="start"
                            type="date"
                            required
                            min={latest.start}
                          />
                        </label>
                        <label>
                          Source quote
                          <textarea
                            name="quote"
                            required
                            maxLength={2000}
                            placeholder="Quote the specification that supports this change."
                          />
                        </label>
                        <label>
                          Reason for change
                          <input
                            name="reason"
                            required
                            minLength={3}
                            maxLength={1000}
                          />
                        </label>
                        <Submit>Preview impact</Submit>
                      </Form>
                    </>
                  )}
                </div>
              </details>
            );
          })}
          <details className="fact-record card" open={list.length === 0}>
            <summary>
              <strong>+ Add approved fact</strong>
            </summary>
            <div className="fact-content">
              <Form path={path} className="stack">
                <Hidden values={{ action: "fact" }} />
                <label>
                  Product variant
                  <input
                    name="variant"
                    required
                    maxLength={80}
                    defaultValue={c.name}
                  />
                </label>
                <label>
                  Fact label
                  <input name="label" required maxLength={80} />
                </label>
                <label>
                  Approved wording
                  <input name="word" required maxLength={240} />
                </label>
                <label>
                  Effective from
                  <input name="start" type="date" required />
                </label>
                <label>
                  Source quote
                  <textarea name="quote" required maxLength={2000} />
                </label>
                <label>
                  Reason for change
                  <input
                    name="reason"
                    required
                    minLength={3}
                    maxLength={1000}
                  />
                </label>
                <Submit>Preview new fact</Submit>
              </Form>
            </div>
          </details>
        </section>
        <aside className="registry-note card">
          <span className="note-icon" aria-hidden="true">
            ↳
          </span>
          <h3>A source change has a ripple.</h3>
          <p>
            Supported claims retain their exact fact-version links. New evidence
            also reopens unresolved claims for the same product and metric.
          </p>
          <hr />
          <strong>Dates matter</strong>
          <p>
            A fact applies from its effective date, up to—but excluding—its end
            date. Review always uses the asset’s selected publication date.
          </p>
          <Link href={"/campaigns/" + id}>Back to campaign overview →</Link>
        </aside>
      </div>
    </>
  );
}
