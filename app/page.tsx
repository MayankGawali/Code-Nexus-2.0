import Link from "next/link";
import { database } from "../lib/db";
import { campaigns, assets, status } from "../lib/review";
import { Form, Submit } from "./form";
import { Hidden, Badge } from "./fields";
export const dynamic = "force-dynamic";
export default function Home() {
  const db = database(),
    list = campaigns(db);
  return (
    <>
      <section className="landing">
        <div>
          <p className="eyebrow">CAMPAIGN ASSURANCE, BEFORE PUBLICATION</p>
          <h1>
            Good creative.
            <br />
            Grounded claims.
          </h1>
          <p className="lede">
            A calm place to check the facts, refine your copy, and sign off with
            confidence.
          </p>
          {list[0] ? (
            <Link className="button" href={"/campaigns/" + list[0].id}>
              Open {list[0].name} <span aria-hidden="true">↗</span>
            </Link>
          ) : (
            <Form path="/">
              <Hidden values={{ action: "start" }} />
              <Submit>Load Aster Watch demo →</Submit>
            </Form>
          )}
          <p className="quiet">
            Fictional products. Real evidence and decisions. Everything stays in
            local SQLite.
          </p>
        </div>
        <div className="intro-card">
          <span className="mini-label">YOUR REVIEW LOOP</span>
          <ol>
            <li>
              <b>01</b>
              <div>
                <strong>Set the source of truth</strong>
                <p>Version approved facts and see what a change affects.</p>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>Inspect every claim</strong>
                <p>Trace exact wording to the evidence behind it.</p>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>Make the call</strong>
                <p>Correct, re-audit, then approve a specific revision.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <div className="section-heading">
        <h2>Your campaigns</h2>
        <span>
          {list.length} {list.length === 1 ? "campaign" : "campaigns"}
        </span>
      </div>
      {!list.length && (
        <div className="empty card">
          Your workspace is ready. Load the demo above to explore three campaign
          assets and their approved sources.
        </div>
      )}
      <div className="campaign-grid">
        {list.map((c) => {
          const all = assets(db, c.id),
            approved = all.filter(
              (a) => status(db, a.id) === "Approved",
            ).length;
          return (
            <Link
              href={"/campaigns/" + c.id}
              className="campaign-card card"
              key={c.id}
            >
              <div className="campaign-art" aria-hidden="true">
                <div className="watch">
                  <span>ASTER</span>
                  <b>12:24</b>
                </div>
                <span>
                  ASTER
                  <br />
                  WATCH
                </span>
              </div>
              <div className="campaign-caption">
                <p className="eyebrow">LAUNCH CAMPAIGN</p>
                <h2>
                  {c.name} <span aria-hidden="true">↗</span>
                </h2>
                <p>
                  Publication {c.publication} · {all.length} assets
                </p>
                <Badge
                  value={
                    approved === all.length && all.length > 0
                      ? "Approved"
                      : "In review"
                  }
                />
                <span className="quiet">
                  {approved} of {all.length} assets approved
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
