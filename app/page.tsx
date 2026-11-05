import Link from "next/link";
import { database } from "../lib/db";
import { campaigns, assets } from "../lib/review";
export const dynamic = "force-dynamic";
export default function Page() {
  const db = database(),
    list = campaigns(db);
  return (
    <>
      <p className="kicker">WORKSPACE &nbsp; / &nbsp; 01</p>
      <h1>Campaign desk</h1>
      <p className="lead">
        Review campaign copy against approved product facts.
      </p>
      <div className="section">
        <h2>Campaigns</h2>
        <small>{list.length} IN WORKSPACE</small>
      </div>
      {list.map((c) => (
        <Link className="campaign card" key={c.id} href={"/campaigns/" + c.id}>
          <div className="emblem" aria-hidden="true">
            ✳
          </div>
          <div>
            <p className="kicker">LAUNCH CAMPAIGN</p>
            <h2>{c.name}</h2>
            <p>
              {assets(db, c.id).length} assets · Publication {c.publication}
            </p>
          </div>
          <strong className="arrow">↗</strong>
        </Link>
      ))}
      {!list.length && (
        <p>No campaigns yet. Run npm run db:seed to load the demo.</p>
      )}
    </>
  );
}
