import Link from "next/link";
import "./style.css";
export const metadata = {
  title: "Prometheus | Review desk",
  description: "A local campaign evidence and review workspace.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/" className="brand">
            <b className="mark">P</b> Prometheus
          </Link>
          <span className="desk"> / &nbsp; Review desk</span>
          <span className="local">● &nbsp; Local workspace</span>
        </header>
        <main>{children}</main>
        <footer>
          PROMETHEUS &nbsp; / &nbsp; REVIEW SYSTEM{" "}
          <span>LOCAL EDITION · 01</span>
        </footer>
      </body>
    </html>
  );
}
