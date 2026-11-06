import Link from "next/link";

export function CampaignNav({
  id,
  active,
  firstAsset,
}: {
  id: string;
  active: string;
  firstAsset?: string;
}) {
  const base = "/campaigns/" + id;
  const assetTarget = firstAsset
    ? base + "/" + firstAsset
    : id === "aster"
      ? base + "/product"
      : base;

  return (
    <nav className="tabs" aria-label="Campaign navigation">
      {[
        ["Overview", base],
        ["Asset review", assetTarget],
        ["Fact registry", base + "/facts"],
        ["Brand Pack & Rules", base + "/rules"],
        ["Channel Simulator", base + "/simulator"],
        ["Governance Telemetry", base + "/telemetry"],
        ["Audit Certificate", base + "/certificate"],
        ["Revision history", base + "/history"],
      ].map(([label, href]) => (
        <Link
          key={label}
          href={href}
          aria-current={active === label ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="lede">{description}</p>}
      </div>
      {children}
    </div>
  );
}
