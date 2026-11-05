import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../lib/db";
import {
  assets,
  campaigns,
  facts,
  versions,
  status,
} from "../../../lib/review";
import { act } from "../../actions";
import { Badge, Hidden } from "../../fields";
export const dynamic = "force-dynamic";
export default async function Campaign({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params,
    db = database(),
    c = campaigns(db).find((c) => c.id === id);
  if (!c) notFound();
  const list = assets(db, id),
    path = "/campaigns/" + id,
    submit = act.bind(null, path),
    error = (await searchParams).error;
  return (
    <>
      <Link className="back" href="/">
        ← Campaign desk
      </Link>
      <p className="kicker">CAMPAIGN DOSSIER &nbsp; / &nbsp; 001</p>
      <h1>{c.name}</h1>
      <p className="lead">
        Launch review <i>/</i> Planned publication {c.publication}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="section">
        <h2>Campaign assets</h2>
        <small>{list.length} ITEMS</small>
      </div>
      <div className="card">
        {list.map((a, i) => (
          <Link className="row" href={path + "/" + a.id} key={a.id}>
            <small>0{i + 1}</small>
            <div>
              <strong>{a.name}</strong>
              <p>
                {a.channel} · {a.variant}
              </p>
            </div>
            <Badge value={status(db, a.id)} />
            <b>→</b>
          </Link>
        ))}
      </div>
      <div className="section">
        <h2>Fact registry</h2>
        <small>PRODUCT LIBRARY</small>
      </div>
      <p>
        Approved wording and effective dates by product variant. Open a record
        to manage its versions.
      </p>
      {facts(db).map((f) => {
        const history = versions(db, f.id),
          latest = history[0];
        return (
          <details className="card" key={f.id}>
            <summary>
              <span>
                <small>{f.variant}</small>
                <strong>{f.label}</strong>
              </span>
              <span className="preview">{latest.wording}</span>
            </summary>
            {history.map((v) => (
              <p key={v.id}>
                <code>V{v.id}</code> “{v.wording}” · {v.start} to{" "}
                {v.until || "open"} (exclusive)
              </p>
            ))}
            <form action={submit}>
              <Hidden
                values={{ action: "version", id: f.id, expected: latest.id }}
              />
              <label>
                New approved wording
                <input name="word" required maxLength={240} />
              </label>
              <label>
                Effective from
                <input type="date" name="start" required />
              </label>
              <button>Publish version</button>
            </form>
          </details>
        );
      })}
      <details className="card">
        <summary>
          <strong>+ Add approved fact</strong>
        </summary>
        <form action={submit}>
          <Hidden values={{ action: "fact" }} />
          <label>
            Product variant
            <input name="variant" required defaultValue={list[0]?.variant} />
          </label>
          <label>
            Fact label
            <input name="label" required />
          </label>
          <label>
            Approved wording
            <input name="word" required />
          </label>
          <label>
            Effective from
            <input type="date" name="start" required />
          </label>
          <button>Add fact</button>
        </form>
      </details>
    </>
  );
}
