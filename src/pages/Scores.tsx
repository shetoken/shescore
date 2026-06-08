import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RTooltip,
  AreaChart, Area,
} from "recharts";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { pageByKey, SITE } from "@/config/manifest";
import { api, type CountryWEI } from "@/lib/api";
import { applyVersionList, meanScore } from "@/lib/scoring";
import { type ApiVersion } from "@/config/apiVersion";
import { PILLARS } from "@/theme/pillars";
import { WorldMap } from "@/components/WorldMap";
import { Search, ArrowUpDown, Map as MapIcon, Table as TableIcon, ShieldAlert, Clock, ArrowRight, X } from "lucide-react";

const TIERS: Record<number, { label: string; color: string }> = {
  1: { label: "Tier 1 · Leading", color: "#5BC289" },
  2: { label: "Tier 2 · Advancing", color: "#E0B84E" },
  3: { label: "Tier 3 · Lagging", color: "#E89C5A" },
  4: { label: "Tier 4 · Critical", color: "#E0606A" },
};

/* Companion indexes — display-only, reference only, never inputs to the SHE Score.
   Values are the published global averages; methodology shown on hover. */
const COMPANION_INDEXES = [
  { code: "GPI", label: "Gender Poverty Index", value: 57.6, methodology: "Female poverty rates and access to resources, normalised 0–100." },
  { code: "SVI", label: "Sexual Violence Index", value: 41.0, methodology: "Prevalence of sexual violence and the strength of legal protection." },
  { code: "WADI", label: "Women & AI Displacement", value: 54.9, methodology: "Exposure of women's work to automation and AI-displacement risk." },
  { code: "WEVI", label: "Widow Vulnerability", value: 44.9, methodology: "Legal and economic status and protection of widows." },
  { code: "WHI", label: "Women's Health Index", value: 57.5, methodology: "Maternal, reproductive and mental-health outcomes for women." },
  { code: "WVI", label: "Women's Voice Index", value: 49.8, methodology: "Political representation and civic freedom for women." },
  { code: "Compliance", label: "Rights Compliance", value: 47.9, methodology: "Adherence to CEDAW, SDG 5 and women's-rights treaties." },
];

/* SHE Score formula, version-aware (shown on hover over the SHE Score card). */
const SHE_FORMULA: Record<ApiVersion, { header: string; rows: string[]; note: string }> = {
  v2: {
    header: "v2 — OFFICIAL (5 LIVE pillars)",
    rows: ["Empowerment ×25%", "Education & Literacy ×20%", "Economic Inclusion ×20%", "Health & Survival ×15%", "− Safety (Crime Penalty) ×20%"],
    note: "The published score. Rounded to one decimal, half-up.",
  },
  v3: {
    header: "v3 — SHADOW (reweighted)",
    rows: ["Empowerment ×20%", "Education & Literacy ×15%", "Economic Inclusion ×25%", "Health & Survival ×15%", "− Safety (Crime Penalty) ×25%", "+ 4 candidate pillars · in validation"],
    note: "Shadow only — does not affect the published score.",
  },
};

function IndexCard({ code, label, value, native, tooltip }: {
  code: string; label: string; value: string; native?: boolean; tooltip: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className={`rounded-lg px-4 py-2.5 cursor-default ${native ? "border-2 border-magenta/50 bg-magenta/10" : "border border-border bg-card"}`}>
        <div className={`text-xs font-bold ${native ? "text-magenta-ink" : ""}`}>{code}</div>
        <div className={`font-serif text-xl font-bold tnum ${native ? "" : "text-foreground/90"}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground max-w-[130px] leading-tight">{label}</div>
      </div>
      {/* hover methodology tooltip */}
      <div className="pointer-events-none absolute z-30 hidden group-hover:block bottom-full mb-2 left-0 w-64 rounded-lg border border-border bg-popover p-3 shadow-card text-xs">
        {tooltip}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-serif text-lg font-bold tnum">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Scores() {
  const meta = pageByKey("Scores")!;
  const [search, setSearch] = useState("");
  const [asc, setAsc] = useState(false);
  const [view, setView] = useState<"map" | "table">("map"); // map default
  const [selected, setSelected] = useState<CountryWEI | null>(null);
  const [version, setVersion] = useState<ApiVersion>("v2");

  const { data: summary } = useQuery({ queryKey: ["summary"], queryFn: api.summary, staleTime: 5 * 60 * 1000 });
  const { data, isLoading, isError } = useQuery({ queryKey: ["scores-countries"], queryFn: () => api.wei.countries(105), staleTime: 5 * 60 * 1000 });

  const rawCountries = data?.data ?? [];
  // v3 (SHADOW) reweights the five live pillars; v2 is the published score.
  const countries = applyVersionList(rawCountries, version);
  const unavailable = !isLoading && (isError || rawCountries.length === 0);

  const rows = useMemo(() => {
    const list = countries.filter((c) => [c.country, c.iso_code, c.region].some((f) => (f ?? "").toLowerCase().includes(search.toLowerCase())));
    return [...list].sort((a, b) => (asc ? a.she_score - b.she_score : b.she_score - a.she_score));
  }, [countries, search, asc]);

  // Tier distribution + score histogram from the data.
  const tierData = useMemo(() => [1, 2, 3, 4].map((t) => ({
    name: TIERS[t].label, count: countries.filter((c) => c.tier === t).length, color: TIERS[t].color,
  })), [countries]);
  const histData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ x: `${i * 10}`, count: 0 }));
    countries.forEach((c) => { const b = Math.min(9, Math.floor((c.she_score ?? 0) / 10)); buckets[b].count++; });
    return buckets;
  }, [countries]);

  const global = version === "v3" ? meanScore(countries) : (summary?.global_she_score ?? null);

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/scores`} />

      <div className="container max-w-6xl py-8 space-y-8">
        {/* Header */}
        <header>
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-widest text-magenta-ink">The scores</span>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              Methodology version
              <select value={version} onChange={(e) => setVersion(e.target.value as ApiVersion)}
                className={`h-8 rounded-md border bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${version === "v3" ? "border-magenta/60 text-magenta-ink" : "border-border"}`}>
                <option value="v2">v2 — Official</option>
                <option value="v3">v3 — Shadow preview</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="!text-3xl md:!text-4xl">
              Global SHE Score: <span className={`tnum ${version === "v3" ? "text-magenta-ink" : "text-magenta-ink"}`}>{global != null ? global.toFixed(1) : "…"}</span>
              <span className="text-muted-foreground font-normal text-xl"> / 100</span>
              {version === "v3" && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-widest text-magenta-ink border border-magenta/50 rounded px-1.5 py-0.5">v3 shadow</span>}
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard label="Highest" value={summary?.highest_country ?? "—"} sub={summary ? `${summary.highest_score?.toFixed?.(1) ?? summary.highest_score}` : ""} />
              <StatCard label="Lowest" value={summary?.lowest_country ?? "—"} sub={summary ? `${summary.lowest_score?.toFixed?.(1) ?? summary.lowest_score}` : ""} />
              <StatCard label="Tier 1" value={`${summary?.tier_1_count ?? "—"}`} sub="leading" />
              <StatCard label="Critical" value={`${summary?.tier_4_count ?? "—"}`} sub="tier 4" />
            </div>
          </div>
        </header>

        {/* Companion indexes (display-only) */}
        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">SHE Score + companion indexes · hover for methodology · comparison only, never inputs</p>
          <div className="flex flex-wrap gap-2">
            <IndexCard
              code="SHE Score" label="Women's empowerment" native
              value={global != null ? global.toFixed(1) : "—"}
              tooltip={
                <div>
                  <p className="font-bold text-magenta-ink mb-1">{SHE_FORMULA[version].header}</p>
                  <ul className="space-y-0.5">
                    {SHE_FORMULA[version].rows.map((r) => <li key={r} className="font-mono text-[11px]">{r}</li>)}
                  </ul>
                  <p className="text-muted-foreground mt-1.5">{SHE_FORMULA[version].note}</p>
                </div>
              }
            />
            {COMPANION_INDEXES.map((idx) => (
              <IndexCard
                key={idx.code} code={idx.code} label={idx.label} value={idx.value.toFixed(1)}
                tooltip={
                  <div>
                    <p className="font-bold mb-1">{idx.label}</p>
                    <p className="text-muted-foreground">{idx.methodology}</p>
                    <p className="text-muted-foreground/70 mt-1.5">Global average {idx.value.toFixed(1)} · reference only · never an input to the SHE Score.</p>
                  </div>
                }
              />
            ))}
          </div>
        </section>

        {/* Country Explorer */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl">Country Explorer <span className="text-sm font-normal text-muted-foreground">{countries.length} countries</span></h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  className="h-9 w-44 rounded-md border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
                <button onClick={() => setView("map")} className={`inline-flex items-center gap-1.5 px-3 py-2 ${view === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}><MapIcon className="h-4 w-4" /> Map</button>
                <button onClick={() => setView("table")} className={`inline-flex items-center gap-1.5 px-3 py-2 border-l border-border ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}><TableIcon className="h-4 w-4" /> Table</button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">Loading scores…</div>
          ) : unavailable ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="font-medium">Live scores are temporarily unavailable.</p>
              <p className="mt-1 text-sm text-muted-foreground">The methodology and baseline data remain on the <Link to="/data" className="text-magenta-ink hover:underline">data page</Link>.</p>
            </div>
          ) : view === "map" ? (
            <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
              <WorldMap countries={countries} mapHeight={460} onSelect={setSelected} selectedIso={selected?.iso_code} />
              <SelectedPanel country={selected} onClose={() => setSelected(null)} />
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="text-muted-foreground border-b border-border"><tr>
                  <th className="text-left font-medium px-4 py-3 w-12">#</th>
                  <th className="text-left font-medium px-4 py-3">Country</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Region</th>
                  <th className="text-left font-medium px-4 py-3"><button onClick={() => setAsc((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground">SHE Score <ArrowUpDown className="h-3 w-3" /></button></th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell w-28">Tier</th>
                </tr></thead>
                <tbody>
                  {rows.map((c, i) => (
                    <tr key={c.iso_code} className="border-b border-border/40 last:border-0 hover:bg-accent/40 transition-smooth">
                      <td className="px-4 py-2.5 text-muted-foreground tnum">{asc ? rows.length - i : i + 1}</td>
                      <td className="px-4 py-2.5 font-medium"><Link to={`/scores/${c.iso_code}`} className="hover:text-magenta-ink">{c.country}</Link></td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.region}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden"><div className="h-full bg-foreground/70" style={{ width: `${Math.max(2, c.she_score)}%` }} /></div>
                          <span className="tnum font-semibold w-10">{c.she_score?.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">{TIERS[c.tier] && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: TIERS[c.tier].color, background: `${TIERS[c.tier].color}1f` }}>{TIERS[c.tier].label.split(" · ")[0]}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}
          <p className="source-line">Source: SHE Score v2, {SITE.publisher}. Companion indexes are for reference only and are never inputs to the SHE Score.</p>
        </section>

        {/* Charts */}
        <section className="grid md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-base font-semibold">Distribution of scores</h3>
            <p className="text-sm text-muted-foreground mb-3">How {countries.length} countries spread across the 0–100 scale.</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={histData}>
                <XAxis dataKey="x" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={24} />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="count" stroke="#E24D88" fill="#E24D8833" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="source-line">Bucketed by 10 points.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-base font-semibold">Countries by tier</h3>
            <p className="text-sm text-muted-foreground mb-3">Distribution across the four score tiers.</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={120} />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>{tierData.map((d) => <Cell key={d.name} fill={d.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Explore the data */}
        <section>
          <h2 className="text-xl mb-4">Explore the data</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/safety" className="group rounded-lg border border-border bg-card p-5 hover:border-magenta transition-smooth">
              <ShieldAlert className="h-5 w-5 text-magenta-ink" />
              <div className="mt-2 font-serif text-lg font-semibold">Women's safety map</div>
              <p className="mt-1 text-sm text-muted-foreground">Travel-advisory view by the Safety pillar, with country and state-level detail.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-magenta-ink">Open the safety map <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
            <Link to="/clock" className="group rounded-lg border border-border bg-card p-5 hover:border-magenta transition-smooth">
              <Clock className="h-5 w-5 text-magenta-ink" />
              <div className="mt-2 font-serif text-lg font-semibold">A year in the life</div>
              <p className="mt-1 text-sm text-muted-foreground">What the numbers mean for 100 girls over a year — births, schooling, marriage, health and loss.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-magenta-ink">Open the figures <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          </div>
        </section>

        {/* About the data */}
        <section className="rounded-lg border border-border bg-card p-6 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">The SHE Score</h3>
            <p className="text-muted-foreground">The published score (v2) is computed from five LIVE pillars — Empowerment (25%), Education &amp; Literacy (20%), Economic Inclusion (20%), Health &amp; Survival (15%) and Safety (Crime Penalty, −20%). Four further pillars are in validation. Published annually, quarterly for registered governments.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Companion indexes</h3>
            <ul className="text-muted-foreground space-y-1">
              {COMPANION_INDEXES.map((idx) => <li key={idx.code}><span className="text-foreground/80 font-medium">{idx.code}</span> — {idx.label}</li>)}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">Reference only; in development; never inputs to the SHE Score.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Sources &amp; methodology</h3>
            <p className="text-muted-foreground">Built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data. All scores normalised 0–100; higher is better for women. Scores are indicative and for research and awareness.</p>
            <Link to="/methodology" className="text-magenta-ink hover:underline mt-1 inline-block">Read the methodology →</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function SelectedPanel({ country, onClose }: { country: CountryWEI | null; onClose: () => void }) {
  if (!country) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground text-center lg:sticky lg:top-24">
        Click a country on the map to see its pillar breakdown.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{country.region} · Rank #{country.rank}</div>
          <div className="font-serif text-xl font-bold">{country.country}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="font-serif text-5xl font-bold tnum mt-2">{country.she_score?.toFixed(1)}</div>
      <div className="text-sm text-muted-foreground">SHE Score / 100</div>
      <div className="mt-4 space-y-2">
        {PILLARS.map((p) => {
          const raw = (country as unknown as Record<string, number>)[p.field] ?? 0;
          return (
            <div key={p.key}>
              <div className="flex justify-between text-xs mb-0.5"><span>{p.label}</span><span className="tnum">{raw}</span></div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, raw))}%`, background: p.hex }} /></div>
            </div>
          );
        })}
      </div>
      <Link to={`/scores/${country.iso_code}`} className="mt-4 block text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth">
        Full country profile →
      </Link>
    </div>
  );
}
