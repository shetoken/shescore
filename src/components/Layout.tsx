import { Link, NavLink } from "react-router-dom";
import { NAV_PAGES, SITE } from "@/config/manifest";
import { Wordmark } from "@/components/design/Wordmark";

/* Institutional shell — typographic wordmark, serif/sans system, paper ground.
   No coin imagery anywhere. */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      <header className="border-t-[3px] border-t-magenta border-b border-border bg-background/90 backdrop-blur sticky top-0 z-40">
        <nav className="container flex items-center justify-between h-16 gap-4" aria-label="Primary">
          <Wordmark className="text-xl" />
          <div className="hidden md:flex items-center gap-6 text-sm">
            {NAV_PAGES.map((p) => (
              <NavLink
                key={p.path}
                to={p.path}
                className={({ isActive }) =>
                  `relative py-1 transition-smooth hover:text-magenta-ink ${
                    isActive
                      ? "text-primary font-medium after:absolute after:inset-x-0 after:-bottom-[1.05rem] after:h-0.5 after:bg-magenta"
                      : "text-foreground/70"
                  }`
                }
              >
                {p.navLabel ?? p.title}
              </NavLink>
            ))}
          </div>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth"
          >
            Register data
          </Link>
        </nav>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="border-t border-border bg-secondary/40 mt-12">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Wordmark as="span" className="text-lg" />
              <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                An open-source, auditable measure of women's empowerment in 105 countries.
                Published by {SITE.publisher}.
              </p>
            </div>
            <nav className="text-sm" aria-label="Footer — the index">
              <p className="font-semibold text-foreground mb-2">The index</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/scores" className="hover:text-primary">Scores</Link></li>
                <li><Link to="/methodology" className="hover:text-primary">Methodology</Link></li>
                <li><Link to="/lab" className="hover:text-primary">The Lab</Link></li>
                <li><Link to="/data" className="hover:text-primary">Data &amp; API</Link></li>
              </ul>
            </nav>
            <nav className="text-sm" aria-label="Footer — the foundation">
              <p className="font-semibold text-foreground mb-2">The Foundation</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary">About</Link></li>
                <li><Link to="/governance" className="hover:text-primary">Governance</Link></li>
                <li><Link to="/register" className="hover:text-primary">Register data</Link></li>
                <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
                <li><a href="mailto:contact@shescore.org" className="hover:text-primary">Contact</a></li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 pt-6 border-t border-border space-y-3 text-xs text-muted-foreground">
            {/* Naming key (no $SHE line on this target, per the content firewall) */}
            <p className="text-foreground/80">
              <strong>SHE Score</strong> — the index. <strong>{SITE.publisher}</strong> — the publisher.
            </p>
            <p className="max-w-3xl">
              The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the
              UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.
            </p>
            <p>The SHE Score methodology is published and open source. Annual scores publish on the documented cycle.</p>
            <p className="text-muted-foreground/70">{SITE.tokenLine}</p>
            <p>© {new Date().getFullYear()} {SITE.publisher}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
