import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { pillarByKey } from "@/theme/pillars";
import { ArrowRight } from "lucide-react";

/* "A day in the life" — the SHE Score's pillars translated into human terms for a
   cohort of 100 girls. Figures are illustrative global averages with the source
   noted; each maps to one of the five LIVE pillars. */
const FIGURES: { n: number; headline: string; detail: string; pillar: string; source: string }[] = [
  { n: 19, headline: "marry as children", detail: "before their 18th birthday — about 1 in 5.", pillar: "empowerment", source: "UNICEF" },
  { n: 13, headline: "leave school early", detail: "won't complete secondary education.", pillar: "education", source: "UNESCO" },
  { n: 53, headline: "are shut out of paid work", detail: "are not in the formal labour force.", pillar: "economic", source: "ILO" },
  { n: 10, headline: "become mothers as teens", detail: "will have their first child before 18.", pillar: "health", source: "WHO · UNFPA" },
  { n: 27, headline: "will face violence", detail: "from an intimate partner in their lifetime.", pillar: "safety", source: "WHO" },
  { n: 73, headline: "have little political voice", detail: "live where women hold under a third of parliamentary seats.", pillar: "empowerment", source: "IPU" },
];

export default function Clock() {
  const meta = pageByKey("Clock")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/clock`} />
      <PageHero
        eyebrow="A day in the life"
        title="What the numbers mean for 100 girls"
        lead={<>The SHE Score is built from data — but every point stands for a life. Picture <strong className="text-foreground">100 girls</strong> growing up in the world today. Here is what an ordinary day, repeated across their childhoods, looks like.</>}
      />

      <div className="container max-w-5xl py-10 space-y-8">
        <div className="rounded-md border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm">
          <strong className="text-magenta-ink">Illustrative</strong> — figures are global averages from the sources noted, rounded to a cohort of 100. They vary widely by country; see the <Link to="/scores" className="text-magenta-ink hover:underline">country dashboard</Link>.
        </div>

        {/* The 100 girls */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIGURES.map((f) => {
            const p = pillarByKey(f.pillar)!;
            return (
              <div key={f.headline} className="rounded-lg border border-border bg-card p-5 flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif text-5xl font-bold tnum leading-none" style={{ color: p.hex }}>{f.n}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <div className="mt-2 font-serif text-lg font-semibold leading-tight">{f.headline}</div>
                <p className="mt-1 text-sm text-muted-foreground leading-snug flex-1">{f.detail}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: p.hex }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: p.hex }} />{p.label}
                  </span>
                  <span className="text-muted-foreground">{f.source}</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Synthesis */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl mb-2">Why one number</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            No single statistic captures a girl's life — which is why the SHE Score combines five LIVE pillars
            (Empowerment, Education &amp; Literacy, Economic Inclusion, Health &amp; Survival, and a Safety crime penalty)
            into one auditable 0–100 number per country. It rises when girls stay in school, earn, decide, and live free
            of violence; it falls when they don't. Each point you see on the map is some of these 100 girls.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link to="/scores" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">See the country scores <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">The women's safety map <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link to="/methodology" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">How the score is built <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        <p className="source-line">Sources: UNICEF, UNESCO, ILO, WHO, UNFPA, IPU — global averages, illustrative. Published by {SITE.publisher}.</p>
      </div>
    </Layout>
  );
}
