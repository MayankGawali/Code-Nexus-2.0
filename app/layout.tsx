import Link from "next/link";
import "./style.css";
export const metadata = {
  title: "Prometheus — Review workbench",
  description: "Evidence-led campaign review in your local workspace.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip">
          Skip to workbench
        </a>
        <header className="app-header">
          <Link href="/" className="brand">
            <span className="brand-symbol" aria-hidden="true">
              P
            </span>
            prometheus<span className="brand-divider">/</span>
            <span className="brand-sub">Review workbench</span>
          </Link>
          <span className="identity">
            <span className="avatar">DR</span>
            <span>
              Local demo reviewer<small>No account required</small>
            </span>
          </span>
        </header>
        <main id="main">{children}</main>
        <footer>
          <span>
            Prometheus <b>·</b> Local review workspace
          </span>
          <span>Evidence first. Human approval.</span>
        </footer>
      </body>
    </html>
  );
}
