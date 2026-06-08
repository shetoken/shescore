import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { WorldMap } from "@/components/WorldMap";
import { pageByKey, SITE } from "@/config/manifest";
import { api } from "@/lib/api";
import { ShieldAlert, ArrowRight, MapPin } from "lucide-react";

/* Travel-advisory bands for the Safety (crime & violence) pillar. The pillar is
   a penalty: a HIGHER value = more reported violence against women = higher risk.
   Bands run green (lower risk) → red (higher risk). Thresholds are indicative. */
const ADVISORY = [
  { min: 50, label: "High risk",  sub: "Avoid non-essential travel",       color: "#E0606A" },
  { min: 38, label: "Elevated",   sub: "Reconsider travel",                color: "#E89C5A" },
  { min: 26, label: "Moderate",   sub: "Exercise increased caution",       color: "#E0B84E" },
  { min: 0,  label: "Lower risk", sub: "Exercise normal precautions",      color: "#5BC289" },
];
const advisoryFor = (v: number | null | undefined) =>
  v == null ? null : (ADVISORY.find((a) => v >= a.min) ?? ADVISORY[ADVISORY.length - 1]);
const advisoryColor = (v: number | null | undefined) => advisoryFor(v)?.color ?? "#1e293b";

export default function Safety() {
  const meta = pageByKey("Safety")!;
  const { data, isLoading } = useQuery({ queryKey: ["safety-countries"], queryFn: () => api.wei.countries(250), staleTime: 5 * 60 * 1000 });
  const countries = data?.data ?? [];

  // Map each country to its crime/violence level (the Safety pillar value).
  const riskOverride = useMemo(
    () => new Map(countries.map((c) => [c.iso_code, c.violence_penalty_score])),
    [countries],
  );
  const ranked = useMemo(
    () => [...countries].filter((c) => typeof c.violence_penalty_score === "number")
      .sort((a, b) => b.violence_penalty_score - a.violence_penalty_score),
    [countries],
  );
  const highest = ranked.slice(0, 8);
  const lowest = [...ranked].reverse().slice(0, 8);

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/safety`} />
      <PageHero
        eyebrow="Women's safety"
        title="The women's safety map"
        lead={<>A travel-advisory view of women's safety, shaded by the SHE Score's <strong className="text-foreground">Safety (crime &amp; violence)</strong> pillar. Higher shading = more reported violence against women and a higher-caution rating.</>}
      />

      <div className="container max-w-6xl py-10 space-y-8">
        {/* Illustrative note */}
        <div className="rounded-md border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm">
          <strong className="text-magenta-ink">Advisory, not a guarantee.</strong> Risk bands are derived from the published
          Safety pillar (reported crime &amp; violence against women) and are indicative — always consult official government
          travel advice. <Link to="/methodology" className="text-magenta-ink hover:underline">How the pillar is built →</Link>
        </div>

        {/* Map */}
        <section className="rounded-lg border border-border bg-card p-4">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading the safety map…</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-lg !mb-0">Risk by country <span className="text-sm font-normal text-muted-foreground">{countries.length} countries</span></h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {ADVISORY.map((a) => (
                    <span key={a.label} className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm" style={{ background: a.color }} />
                      <span className="font-medium">{a.label}</span>
                      <span className="text-muted-foreground hidden sm:inline">· {a.sub}</span>
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: "#1e293b" }} /> No data</span>
                </div>
              </div>
              <WorldMap
                countries={countries}
                scoreOverride={riskOverride}
                colorFor={advisoryColor}
                indexLabel="Crime & violence"
                hideLegend
                mapHeight={460}
                subnationalIsos={new Set(["IND"])}
              />
              <p className="mt-2 text-xs text-muted-foreground/70">Click a country for its full profile. India is marked for state-level detail (below).</p>
            </>
          )}
        </section>

        {/* Highest / lowest risk lists */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><ShieldAlert className="h-4 w-4 text-[#E0606A]" /> Highest-caution countries</h3>
            <ul className="space-y-2 text-sm">
              {highest.map((c) => {
                const a = advisoryFor(c.violence_penalty_score)!;
                return (
                  <li key={c.iso_code} className="flex items-center justify-between gap-3">
                    <Link to={`/scores/${c.iso_code}`} className="hover:text-magenta-ink">{c.country}</Link>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: a.color, background: `${a.color}1f` }}>{a.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><ShieldAlert className="h-4 w-4 text-[#5BC289]" /> Lower-risk countries</h3>
            <ul className="space-y-2 text-sm">
              {lowest.map((c) => {
                const a = advisoryFor(c.violence_penalty_score)!;
                return (
                  <li key={c.iso_code} className="flex items-center justify-between gap-3">
                    <Link to={`/scores/${c.iso_code}`} className="hover:text-magenta-ink">{c.country}</Link>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: a.color, background: `${a.color}1f` }}>{a.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* India state-level callout */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-magenta-ink" /> State-level detail — India</h3>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The SHE Score supports sub-national resolution: where a government registers verified data, states and provinces are
            scored individually. India's state-level safety scores (e.g. the West Bengal worked example, 39.1) publish through the
            data-verification program. State maps render here when the live scoring API is connected.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/scores/IND" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">India country profile <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link to="/register" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">Register state data <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        {/* Cross-link */}
        <div className="flex flex-wrap gap-4">
          <Link to="/scores" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">← Back to the dashboard</Link>
          <Link to="/clock" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">A day in the life <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <p className="source-line">Source: SHE Score v2 Safety pillar, {SITE.publisher}. Risk bands are indicative; consult official travel advisories.</p>
      </div>
    </Layout>
  );
}
