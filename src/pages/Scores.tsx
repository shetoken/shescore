import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { api, type CountryWEI } from "@/lib/api";
import { PILLARS } from "@/theme/pillars";
import { Search, ArrowUpDown } from "lucide-react";

const TIERS: Record<number, { label: string; color: string }> = {
  1: { label: "Tier 1", color: "#5BC289" },
  2: { label: "Tier 2", color: "#E0B84E" },
  3: { label: "Tier 3", color: "#E89C5A" },
  4: { label: "Tier 4", color: "#E0606A" },
};

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
      <span className="tnum font-semibold w-10">{value.toFixed(1)}</span>
    </div>
  );
}

export default function Scores() {
  const meta = pageByKey("Scores")!;
  const [search, setSearch] = useState("");
  const [asc, setAsc] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scores-countries"],
    queryFn: () => api.wei.countries(105),
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const list = (data?.data ?? []).filter((c) =>
      [c.country, c.iso_code, c.region].some((f) => (f ?? "").toLowerCase().includes(search.toLowerCase()))
    );
    return [...list].sort((a, b) => (asc ? a.she_score - b.she_score : b.she_score - a.she_score));
  }, [data, search, asc]);

  const unavailable = !isLoading && (isError || (data?.data ?? []).length === 0);

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/scores`} />
      <PageHero
        eyebrow="The scores · v2"
        title="SHE Score rankings"
        lead="The published v2 score for 105 countries, built from independent institutional data. Click any country for its full pillar breakdown."
      />

      <div className="container max-w-5xl py-10">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="h-10 w-64 rounded-md border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Pillars:</span>
            {PILLARS.map((p) => (
              <span key={p.key} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: p.hex }} />{p.label.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">Loading scores…</div>
        ) : unavailable ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="font-medium">Live scores are temporarily unavailable.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The dataset is being refreshed. The full methodology and the baseline data remain available on the{" "}
              <Link to="/data" className="text-magenta-ink hover:underline">data page</Link>.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-12">#</th>
                    <th className="text-left font-medium px-4 py-3">Country</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Region</th>
                    <th className="text-left font-medium px-4 py-3">
                      <button onClick={() => setAsc((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground">
                        SHE Score <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Pillars</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell w-20">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c, i) => (
                    <tr key={c.iso_code} className="border-b border-border/40 last:border-0 hover:bg-accent/40 transition-smooth">
                      <td className="px-4 py-2.5 text-muted-foreground tnum">{asc ? rows.length - i : i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">
                        <Link to={`/scores/${c.iso_code}`} className="hover:text-magenta-ink">{c.country}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.region}</td>
                      <td className="px-4 py-2.5"><ScoreBar value={c.she_score} /></td>
                      <td className="px-4 py-2.5 hidden lg:table-cell"><MiniPillars c={c} /></td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        {TIERS[c.tier] && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: TIERS[c.tier].color, background: `${TIERS[c.tier].color}1f` }}>
                            {TIERS[c.tier].label}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="source-line">
          Source: SHE Score v2, {SITE.publisher}. Third-party index scores, where shown, are for reference only and are
          never inputs to the SHE Score. {data && (data.data?.length ?? 0) > 0 ? `${data.data!.length} countries.` : ""}
        </p>
      </div>
    </Layout>
  );
}

function MiniPillars({ c }: { c: CountryWEI }) {
  return (
    <div className="flex items-center gap-1">
      {PILLARS.map((p) => {
        const raw = (c as unknown as Record<string, number>)[p.field] ?? 0;
        const v = p.penalty ? 100 - raw : raw; // show penalty inverted so taller = better
        return (
          <div key={p.key} className="h-6 w-1.5 rounded-sm bg-border overflow-hidden flex items-end" title={`${p.label}: ${raw}`}>
            <div className="w-full rounded-sm" style={{ height: `${Math.max(6, Math.min(100, v))}%`, background: p.hex }} />
          </div>
        );
      })}
    </div>
  );
}
