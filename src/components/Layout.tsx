import { Link, NavLink } from "react-router-dom";
import { NAV_PAGES, SITE } from "@/config/manifest";

/* Institutional shell — typographic wordmark, no coin imagery.
   Full nav/footer polish lands in Task 2 (design) + Task 8 (trust/hygiene);
   this establishes the per-target nav, footer, naming key and disclaimers. */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <nav className="container flex items-center justify-between h-16 gap-4">
          <Link to="/" className="font-serif text-xl font-bold text-primary tracking-tight shrink-0">
            SHE&nbsp;Score
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm">
            {NAV_PAGES.map((p) => (
              <NavLink
                key={p.path}
                to={p.path}
                className={({ isActive }) =>
                  `transition-smooth hover:text-primary ${isActive ? "text-primary font-medium" : "text-foreground/70"}`
                }
              >
                {p.navLabel ?? p.title}
              </NavLink>
            ))}
          </div>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth"
          >
            Register data
          </Link>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-secondary/40 mt-16">
        <div className="container py-10 text-sm text-muted-foreground space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/methodology" className="hover:text-primary">Methodology</Link>
            <Link to="/data" className="hover:text-primary">Data</Link>
            <Link to="/governance" className="hover:text-primary">Governance</Link>
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/register" className="hover:text-primary">Register</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <a href="mailto:contact@shescore.org" className="hover:text-primary">Contact</a>
          </div>

          {/* Naming key (no $SHE line on this target, per the content firewall) */}
          <p className="text-foreground/80">
            <strong>SHE Score</strong> — the index. <strong>{SITE.publisher}</strong> — the publisher.
          </p>

          {/* Independence disclaimer */}
          <p className="text-xs max-w-3xl">
            The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the
            UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this
            site.
          </p>

          {/* Status line (institutional wording — no phase ribbon, no token pre-launch language) */}
          <p className="text-xs">
            The SHE Score methodology is published and open source. Annual scores publish on the documented cycle.
          </p>

          {/* The single permitted reference to the token project (firewall exception) */}
          <p className="text-xs text-muted-foreground/70">{SITE.tokenLine}</p>

          <p className="text-xs">© {new Date().getFullYear()} {SITE.publisher} · Published by the SHE Score Foundation.</p>
        </div>
      </footer>
    </div>
  );
}
