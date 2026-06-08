import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { api } from "@/lib/api";
import { v3Score, PILLAR_WEIGHT_TABLE } from "@/lib/scoring";
import { ShadowBadge } from "@/components/design/Badges";
import { AlertTriangle } from "lucide-react";

const CANDIDATES = [
  ["Bodily Autonomy", "Period poverty, child marriage, FGM, reproductive rights", "No institutional 105-country dataset for period poverty"],
  ["Dignity & Welfare", "Widow rights, caregiver burden, food insecurity, mental health", "No ≥80%-coverage dataset for unpaid-care burden"],
  ["Digital & Social", "Online harassment, internet & mobile gender gaps", "Online-harassment prevalence lacks comparable cross-country data"],
  ["Safety & Justice (expanded)", "Police responsiveness, legal aid access, honour-based violence", "No ≥80%-coverage dataset for police responsiveness to GBV"],
];

export default function Lab() {
  const meta = pageByKey("Lab")!;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["lab-countries"], queryFn: () => api.wei.countries(105), staleTime: 5 * 60 * 1000,
  });
  const rows = (data?.data ?? [])
    .map((c) => ({ iso: c.iso_code, country: c.country, v2: c.she_score ?? 0, v3: v3Score(c) }))
    .sort((a, b) => b.v3 - a.v3);
  const unavailable = !isLoading && rows.length === 0;

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/lab`} />
      <PageHero
        eyebrow="The Methodology Lab"
        title="Validating the next version, in public"
        lead="v3 is explored openly before anything ships. Shadow scores and candidate pillars live here — they do not yet affect published scores."
      >
        <ShadowBadge />
      </PageHero>

      <div className="container max-w-3xl py-12 space-y-12">
        {/* Persistent shadow notice */}
        <div className="rounded-md border border-dashed border-border bg-card px-4 py-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Shadow — in validation.</strong> Everything on this page is provisional and
            does not affect the published SHE Score.
          </p>
        </div>

        {/* v3 reweight */}
        <section>
          <h2>v3 shadow scores</h2>
          <p className="mt-3 text-foreground/80">
            v3 reweights the five live pillars (heavier Economic Inclusion and Safety, lighter Empowerment and Education),
            using only existing pillar data — a stricter lens. It also tracks four candidate pillars below.
          </p>
          <div className="mt-4 inline-flex flex-wrap gap-2">
            {PILLAR_WEIGHT_TABLE.filter((p) => p.v2 !== p.v3).map((p) => (
              <span key={p.label} className="text-xs rounded-full border border-border bg-card px-2.5 py-1">
                {p.label} <span className="font-mono text-muted-foreground">{Math.round(Math.abs(p.v2) * 100)}%→</span>
                <span className="font-mono text-magenta-ink">{Math.round(Math.abs(p.v3) * 100)}%</span>
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Loading…</div>
          ) : unavailable ? (
            <div className="mt-5 rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Shadow data unavailable right now.</div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-border bg-card overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="text-muted-foreground border-b border-border"><tr>
                  {["#", "Country", "v2 official", "v3 shadow", "Δ"].map((h) => <th key={h} className="text-left font-medium px-4 py-2.5">{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.slice(0, 25).map((r, i) => {
                    const d = Math.round((r.v3 - r.v2) * 10) / 10;
                    return (
                      <tr key={r.iso} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-2 text-muted-foreground tnum">{i + 1}</td>
                        <td className="px-4 py-2">{r.country}</td>
                        <td className="px-4 py-2 font-mono text-muted-foreground tnum">{r.v2.toFixed(1)}</td>
                        <td className="px-4 py-2"><span className="font-mono text-magenta-ink border border-magenta/30 rounded px-1.5 py-0.5 text-xs">{r.v3.toFixed(1)}</span></td>
                        <td className={`px-4 py-2 font-mono tnum ${d > 0 ? "text-pillar-economic" : d < 0 ? "text-magenta-ink" : "text-muted-foreground"}`}>{d > 0 ? "+" : ""}{d.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            </div>
          )}
          <p className="source-line">Shadow scores · top 25 shown · computed from the published pillar data. Never a published score.</p>
        </section>

        {/* Activation tracker */}
        <section>
          <h2>Candidate pillar activation</h2>
          <p className="mt-3 text-foreground/80">Each activates only when it independently meets the data standard.</p>
          <div className="mt-4 space-y-3">
            {CANDIDATES.map(([name, ind, gap]) => (
              <div key={name} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-semibold">{name}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Gathering data</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1"><span className="text-foreground/70">Candidate indicators:</span> {ind}</div>
                <div className="text-xs text-muted-foreground"><span className="text-foreground/70">Blocking gap:</span> {gap}</div>
              </div>
            ))}
          </div>
          <p className="source-line">
            <Link to="/methodology" className="text-magenta-ink hover:underline">Read the data standard →</Link>
          </p>
        </section>
      </div>
    </Layout>
  );
}
