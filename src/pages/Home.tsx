import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { pageByKey, SITE } from "@/config/manifest";
import { StatBand } from "@/components/design/StatBand";
import { LiveBadge, PillarDot } from "@/components/design/Badges";
import { PILLARS } from "@/theme/pillars";
import { ArrowRight } from "lucide-react";

const SOURCES = [
  "UN Women", "World Bank", "WHO", "UNODC", "UNESCO", "ILO", "OECD",
];

export default function Home() {
  const meta = pageByKey("Home")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/`} />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-background">
        <div className="container py-16 md:py-24 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-magenta-ink">
              Open data on women's empowerment
            </span>
            <LiveBadge />
          </div>
          <h1 className="max-w-3xl">A single, auditable score for how women live — in 105 countries.</h1>
          <p className="mt-5 text-lg md:text-xl text-foreground/75 max-w-2xl">
            The SHE Score is an open-source, 0–100 measure of women's empowerment, built from independent institutional
            data — UN Women, World Bank, WHO and UNODC. Published annually, with a 30-day public challenge window.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/scores" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth">
              Explore the scores <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/methodology" className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:border-magenta transition-smooth">
              Read the methodology
            </Link>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl py-12 space-y-16">
        <StatBand />

        {/* What it is */}
        <section>
          <h2>What the SHE Score measures</h2>
          <p className="mt-3 text-foreground/80 max-w-2xl">
            One number, 0–100, where higher always means better. It is computed from five LIVE pillars using a published,
            fixed formula — so any score can be reproduced from public data and public code.
          </p>

          {/* Pillars + weights */}
          <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Pillar</th>
                  <th className="text-left font-medium px-4 py-3 w-24">Weight</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">What it captures</th>
                </tr>
              </thead>
              <tbody>
                {PILLARS.map((p) => (
                  <tr key={p.key} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <PillarDot pillarKey={p.key} className="mr-2" />{p.label}
                    </td>
                    <td className="px-4 py-3 tnum" style={{ color: p.hex }}>{p.weightLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{PILLAR_BLURB[p.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="source-line">
            The Safety pillar is a <em>penalty</em> — violence against women is subtracted, never added.{" "}
            <Link to="/methodology" className="text-magenta-ink hover:underline">See the full formula →</Link>
          </p>
        </section>

        {/* Formula callout */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl">The formula</h2>
          <pre className="mt-3 overflow-x-auto text-sm bg-background/40 rounded-md p-4 border border-border">
{`SHE Score (v2) = (Empowerment × 0.25)
               + (Education & Literacy × 0.20)
               + (Economic Inclusion × 0.20)
               + (Health & Survival × 0.15)
               − (Safety / Crime Penalty × 0.20)`}
          </pre>
          <p className="source-line not-italic mt-3 text-muted-foreground">
            Four further pillars are in validation in <Link to="/lab" className="text-magenta-ink hover:underline">The Lab</Link> and
            do not yet affect published scores.
          </p>
        </section>

        {/* Sources */}
        <section>
          <h2>Built from independent institutional data</h2>
          <p className="mt-3 text-foreground/80 max-w-2xl">
            No proprietary surveys, no black box. Every indicator traces to a recognised multilateral or statistical body.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <span key={s} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/80">{s}</span>
            ))}
          </div>
          <p className="source-line">
            <Link to="/data" className="text-magenta-ink hover:underline">Download the data and inputs →</Link>
          </p>
        </section>

        {/* Differentiators / next steps */}
        <section className="grid sm:grid-cols-3 gap-4">
          {[
            { to: "/scores", title: "The scores", body: "Rankings for 105 countries and Indian states, with full pillar breakdowns." },
            { to: "/explorer", title: "Score Explorer", body: "Move the pillars and watch the score respond — illustrative, from a real baseline." },
            { to: "/landscape", title: "The landscape", body: "How the SHE Score relates to every major gender index." },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="group rounded-lg border border-border bg-card p-5 hover:border-magenta transition-smooth">
              <div className="font-serif text-lg font-semibold flex items-center gap-1">{c.title}<ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></div>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
            </Link>
          ))}
        </section>
      </div>
    </Layout>
  );
}

const PILLAR_BLURB: Record<string, string> = {
  empowerment: "Parliamentary seats, ministerial roles, legal rights, freedom of movement",
  education: "Literacy, enrollment, STEM participation, completion rates",
  economic: "Pay gap, formal employment, banking access, property rights",
  health: "Maternal mortality, life expectancy, anaemia, cancer screening",
  safety: "Rape, femicide, dowry violence — subtracted from the composite",
};
