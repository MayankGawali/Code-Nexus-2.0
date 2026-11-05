import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { selectedDate, freshAudit } from "../../../../lib/context";
import { posterStyle, visualFindings } from "../../../../lib/visual";
import { provenance } from "../../../../lib/workflow";
import { CampaignNav, PageTitle } from "../../../components";
import { Workbench } from "../../../workbench";
export const dynamic = "force-dynamic";
export default async function AssetReview({
  params,
}: {
  params: Promise<{ id: string; asset: string }>;
}) {
  const { id, asset } = await params,
    db = database(),
    c = r.campaigns(db).find((c) => c.id === id),
    a = r.assets(db, id).find((a) => a.id === asset);
  if (!c || !a) notFound();
  const revision = r.revisions(db, asset)[0],
    day = selectedDate(db, asset);
  if (!revision) return <p className="empty">This asset has no draft yet.</p>;
  const audit =
      r.audits(db, revision.id).find((run) => run.publication === day) ?? null,
    exceptions = audit ? r.overrides(db, audit.id) : [];
  const findings = audit
    ? r
        .findings(db, audit.id)
        .map((f) => ({
          ...f,
          sources: r
            .sources(db, f.id)
            .map((v) => ({
              ...v,
              sourceQuote: provenance(db, v.id)?.quote ?? null,
              active: v.start <= day && (!v.until || day < v.until),
            })),
          override: exceptions.find((o) => o.finding === f.id) ?? null,
        }))
    : [];
  return (
    <>
      <Link className="breadcrumb" href={"/campaigns/" + id}>
        ← {c.name}
      </Link>
      <PageTitle
        eyebrow={a.channel.toUpperCase() + " / ASSET REVIEW"}
        title={a.name}
        description={
          a.variant +
          " · Inspect the draft, follow its evidence, make the call."
        }
      />
      <CampaignNav id={id} active="Asset review" />
      <Workbench
        key={revision.id + "-" + (audit?.id ?? "none")}
        campaign={id}
        asset={a}
        revision={revision}
        audit={audit}
        findings={findings}
        visual={audit ? visualFindings(db, audit.id) : []}
        style={posterStyle(db, revision.id) ?? null}
        day={day}
        fresh={audit ? freshAudit(db, audit.id) : true}
        ready={audit ? r.resolvedAudit(db, audit.id) : false}
        status={r.status(db, asset)}
        nonce={randomUUID()}
      />
    </>
  );
}
