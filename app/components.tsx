import Link from "next/link";
export function CampaignNav({ id, active }: { id: string; active: string }) {
  const base = "/campaigns/" + id;
  return (
    <nav className="tabs" aria-label="Campaign navigation">
      {[
        ["Overview", base],
        ["Asset review", base + "/product"],
        ["Fact registry", base + "/facts"],
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
