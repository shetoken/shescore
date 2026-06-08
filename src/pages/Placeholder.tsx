import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { SITE, type PageMeta } from "@/config/manifest";
import { StatBand } from "@/components/design/StatBand";
import { PillarChip, LiveBadge } from "@/components/design/Badges";
import { PILLARS } from "@/theme/pillars";

/* Generic page scaffold used by every route until Task 3 fills in real content.
   It renders unique, crawlable copy plus the institutional design system so the
   theme is visible on every route — no route is ever an empty shell. */
export default function Placeholder({ page }: { page: PageMeta }) {
  const isHome = page.path === "/";
  return (
    <Layout>
      <SEO title={page.title} description={page.description} url={`${SITE.origin}${page.path}`} />

      <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-background">
        <div className="container py-14 md:py-20 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--gold))]">
              {isHome ? "Open data on women's empowerment" : "SHE Score"}
            </span>
            {isHome && <LiveBadge />}
          </div>
          <h1>{page.navLabel ?? page.title}</h1>
          <p className="mt-4 text-lg text-foreground/75">{page.description}</p>
        </div>
      </section>

      <div className="container py-12 max-w-3xl space-y-10">
        <StatBand />

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">The five LIVE pillars</p>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <PillarChip key={p.key} pillarKey={p.key} />
            ))}
          </div>
        </div>

        <p className="source-line not-italic text-muted-foreground">
          This page's full content is built in Task 3. Its route, metadata, navigation, sitemap entry, prerendered
          snapshot and the institutional design system shown here are already wired.
        </p>
      </div>
    </Layout>
  );
}
