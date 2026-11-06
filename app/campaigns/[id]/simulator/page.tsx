import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/db";
import * as r from "../../../../lib/review";
import { CampaignNav, PageTitle } from "../../../components";
import { ChannelSimulator } from "../../../components/ChannelSimulator";
import { posterStyle } from "../../../../lib/visual";

export const dynamic = "force-dynamic";

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = database();
  const c = r.campaigns(db).find((c) => c.id === id);
  if (!c) notFound();

  const assets = r.assets(db, id);
  const posterAsset = assets.find((a) => a.channel === "Print") ?? assets[0];
  const posterRev = posterAsset ? r.revisions(db, posterAsset.id)[0] : null;
  const style = posterRev ? posterStyle(db, posterRev.id) : null;

  const emailAsset = assets.find((a) => a.channel === "Email") ?? assets[0];
  const emailRev = emailAsset ? r.revisions(db, emailAsset.id)[0] : null;

  const defaultText =
    emailRev?.body ??
    "Up to 24 hours in standard mode. Titanium case with black and silver finishes.";

  return (
    <>
      <Link className="breadcrumb" href={`/campaigns/${id}`}>
        ← Campaign desk
      </Link>
      <PageTitle
        eyebrow="MULTI-MODAL PUBLICATION PREVIEW"
        title="Cross-Channel Live Pre-Publication Simulator"
        description="Inspect how approved facts, brand tone, and color contrast render across Email newsletters, Social feeds, Web heroes, and Retail displays."
      >
        <div className="publication-stamp">
          <span className="mini-label">ACTIVE CHANNELS</span>
          <strong>4 Simulated Formats</strong>
          <span>Real-time Rendering</span>
        </div>
      </PageTitle>

      <CampaignNav id={id} active="Channel Simulator" />

      <div className="simulator-page-container">
        <ChannelSimulator
          text={defaultText}
          posterColors={{
            foreground: style?.foreground ?? "#ffffff",
            background: style?.background ?? "#173b34",
          }}
        />
      </div>
    </>
  );
}
