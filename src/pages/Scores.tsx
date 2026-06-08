import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, ReferenceLine,
  PieChart, Pie, Cell,
} from "recharts";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { pageByKey, SITE } from "@/config/manifest";
import { api, type CountryWEI } from "@/lib/api";
import { applyVersionList, meanScore } from "@/lib/scoring";
import { type ApiVersion } from "@/config/apiVersion";
import { PILLARS } from "@/theme/pillars";
import { WorldMap } from "@/components/WorldMap";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Search, ArrowUpDown, Map as MapIcon, Table as TableIcon, ShieldAlert, Clock, ArrowRight, X, AlertTriangle, Sparkles, Maximize2, SlidersHorizontal } from "lucide-react";

const C_GOOD = "#5BC289"; // green — high score / leading
const C_BAD = "#E0606A";  // red — low score / critical
const FEMALE_SHARE = 0.495;       // approx female share of population
const WORLD_WOMEN_M = 3950;       // ~3.95B women worldwide (for "% of world women")
const womenM = (popMillions?: number | null) => Math.round((popMillions ?? 0) * FEMALE_SHARE);
// Precise women (millions) + a display formatter that keeps a decimal for small countries.
const womenMexact = (popMillions?: number | null) => (popMillions ?? 0) * FEMALE_SHARE;
const fmtWomenM = (popMillions?: number | null) => {
  const w = womenMexact(popMillions);
  return w >= 10 ? Math.round(w).toLocaleString() : w.toFixed(1);
};

/* Deterministic placeholder per-country score for a companion index (no live
   per-country companion data offline). Stable per country+index, spread around
   the published global average. Clearly labelled illustrative in the UI. */
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function companionScore(iso: string, code: string, avg: number) {
  const off = ((hashStr(iso + code) % 1000) / 1000) * 46 - 23;
  return Math.max(2, Math.min(98, Math.round((avg + off) * 10) / 10));
}

// Severity categories ("bands") by SHE Score — same thresholds & colours as the
// map. Four levels: High (60+) / Moderate / Low / Critical.
const BAND_DEFS = [
  { key: 1, min: 60, label: "High",      color: "#5BC289" },
  { key: 2, min: 45, label: "Moderate",  color: "#E0B84E" },
  { key: 3, min: 30, label: "Low",       color: "#E89C5A" },
  { key: 4, min: 0,  label: "Critical",  color: "#E0606A" },
];
const BANDS: Record<number, { key: number; min: number; label: string; color: string }> =
  Object.fromEntries(BAND_DEFS.map((b) => [b.key, b]));
const bandKey = (score?: number | null) => (BAND_DEFS.find((b) => (score ?? 0) >= b.min) ?? BAND_DEFS[BAND_DEFS.length - 1]).key;

type Formula = { label: string; weight?: string };

/* Companion indexes — display-only, reference only, never inputs to the SHE Score.
   Formula + note shown on hover; values are the published global averages. */
const COMPANION_INDEXES: { code: string; desc: string; title: string; value: number; formula: Formula[]; note: string }[] = [
  { code: "GPI", desc: "Gender Poverty", value: 57.6, title: "Gender Poverty Index",
    formula: [{ label: "Income poverty (F:M)" }, { label: "Wealth gap" }, { label: "Wage gap" }, { label: "Labour participation" }, { label: "Financial inclusion" }, { label: "Food security" }, { label: "Time poverty (unpaid care)" }, { label: "Land ownership" }, { label: "Social protection" }],
    note: "Measures female economic deprivation relative to men across 9 indicators. Sources: World Bank, ILO, OECD." },
  { code: "SVI", desc: "Sexual Violence", value: 41.0, title: "Sexual Violence Index",
    formula: [{ label: "WHO lifetime prevalence" }, { label: "UNODC reported rate" }, { label: "Reporting gap" }, { label: "Marital rape criminalised" }, { label: "Conflict-related SV risk" }, { label: "Digital sexual violence" }, { label: "Legal framework" }, { label: "Support services" }],
    note: "Higher score = safer. Combines prevalence, legal protection and support services. Sources: WHO, UNODC." },
  { code: "WADI", desc: "AI Displacement", value: 54.9, title: "Women & AI Displacement Index",
    formula: [{ label: "Automation exposure" }, { label: "Female sector concentration" }, { label: "Reskilling access" }, { label: "Digital skills gap" }, { label: "AI-policy inclusion" }],
    note: "Higher score = more resilient. Estimates how exposed women's jobs are to AI automation and the capacity to adapt. Sources: ILO, OECD, WEF." },
  { code: "WEVI", desc: "Widow Vulnerability", value: 44.9, title: "Widow Vulnerability Index",
    formula: [{ label: "Inheritance rights" }, { label: "Remarriage freedom" }, { label: "Property rights" }, { label: "Economic support" }, { label: "Social protection" }],
    note: "Higher score = better protected. Legal and economic status of widows. Sources: UN Women, national law." },
  { code: "WHI", desc: "Women's Health", value: 57.5, title: "Women's Health Index",
    formula: [{ label: "Depression prevalence" }, { label: "Suicide rate" }, { label: "Anaemia" }, { label: "Menstrual access" }, { label: "Contraceptive unmet need" }, { label: "Maternal mental-health support" }],
    note: "Higher score = healthier. Focus on reproductive and mental health. Sources: WHO, UNICEF." },
  { code: "WVI", desc: "Women's Voice", value: 49.8, title: "Women's Voice Index",
    formula: [{ label: "Parliamentary seats" }, { label: "Ministerial roles" }, { label: "Local government" }, { label: "Civic participation" }, { label: "Press & protest freedom" }],
    note: "Higher score = louder voice. Political representation and civic freedom. Sources: IPU, V-Dem." },
  { code: "Compliance", desc: "Rights Compliance", value: 47.9, title: "Rights Compliance Index",
    formula: [{ label: "CEDAW ratification" }, { label: "SDG 5 progress" }, { label: "Legal frameworks" }, { label: "Labour conventions" }, { label: "Treaty adherence" }],
    note: "Higher score = stronger compliance. Adherence to international women's-rights treaties. Sources: UN, ILO." },
];

/* SHE Score methodology, version-aware (shown on hover over the SHE Score card). */
const SHE_METHOD: Record<ApiVersion, { title: string; formula: Formula[]; note: string }> = {
  v2: {
    title: "SHE Score (v2 — official)",
    formula: [{ label: "Empowerment", weight: "×25%" }, { label: "Education & Literacy", weight: "×20%" }, { label: "Economic Inclusion", weight: "×20%" }, { label: "Health & Survival", weight: "×15%" }, { label: "− Safety (Crime Penalty)", weight: "×20%" }],
    note: "The SHE Score's native index (v2 — official). Five LIVE weighted pillars, normalised 0–100. The 7 cards to the right are companion comparison indexes.",
  },
  v3: {
    title: "SHE Score (v3 — shadow)",
    formula: [{ label: "Empowerment", weight: "×20% · was 25%" }, { label: "Education & Literacy", weight: "×15% · was 20%" }, { label: "Economic Inclusion", weight: "×25% · was 20%" }, { label: "Health & Survival", weight: "×15% · LIVE" }, { label: "− Safety (Crime Penalty)", weight: "×25% · was 20%" }, { label: "Bodily Autonomy", weight: "TBD · v3" }, { label: "Dignity & Welfare", weight: "TBD · v3" }, { label: "Digital & Social", weight: "TBD · v3" }, { label: "Safety & Justice (expanded)", weight: "TBD · v3" }],
    note: "v3 SHADOW reweights the five live pillars — heavier Economic Inclusion and Safety (Crime Penalty), lighter Empowerment and Education — so scores shift versus v2. It uses only existing pillar data; nothing is imputed. The four candidate pillars are still gathering data and contribute nothing yet. v3 does not affect the published score.",
  },
};

/* One colour per index for the distribution curves + legend. */
const INDEX_COLORS: Record<string, string> = {
  "SHE Score": "#E24D88", GPI: "#a855f7", SVI: "#ef4444", WADI: "#3b82f6",
  WEVI: "#f97316", WHI: "#ec4899", WVI: "#06b6d4", Compliance: "#10b981",
};

/* Gaussian KDE for the real SHE Score distribution; analytic bell for the
   companion indexes (centred on each published average — placeholder until live
   per-country companion data is available). Each series is peak-normalised. */
const gaussianKDE = (values: number[], h = 6) => (x: number) =>
  values.reduce((s, v) => s + Math.exp(-0.5 * ((x - v) / h) ** 2), 0);
const bellAt = (x: number, mean: number, sd: number) => Math.exp(-0.5 * ((x - mean) / sd) ** 2);

function IndexCard({ code, desc, value, native, color, badge, title, formula, note, onClick, selected }: {
  code: string; desc: string; value: string; native?: boolean; color: string; badge?: string; title: string; formula: Formula[]; note: string; onClick?: () => void; selected?: boolean;
}) {
  // Native (SHE Score) reads in gold; companions in their own index colour.
  const accent = native ? "#E0B84E" : color;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div onClick={onClick} className="rounded-lg px-3 py-3 cursor-pointer border-2 transition-smooth"
          style={{ borderColor: selected ? accent : (native ? accent : `${color}55`), background: `${accent}${selected ? "26" : "14"}`, boxShadow: selected ? `0 0 0 2px ${accent}` : undefined }}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="text-[11px] font-bold" style={{ color: accent }}>{code}</div>
            {badge && <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded px-1">{badge}</span>}
          </div>
          <div className="font-serif text-lg font-bold tnum leading-tight mt-0.5" style={{ color: accent }}>{value}</div>
          <div className="text-[10px] text-muted-foreground max-w-[120px] leading-tight mt-0.5">{desc}</div>
        </div>
      </TooltipTrigger>
      {/* Radix tooltip auto-flips/clamps to stay in the viewport (no clipping). */}
      <TooltipContent side="bottom" align="start" collisionPadding={12} className="w-64 max-w-[88vw] p-3 text-xs">
        <p className="font-bold mb-1.5" style={{ color: accent }}>{title}</p>
        <ul className="space-y-0.5">
          {formula.map((f) => {
            const penalty = /crime penalty/i.test(f.label);
            return (
              <li key={f.label} className="flex justify-between gap-3">
                <span style={penalty ? { color: C_BAD } : undefined} className={penalty ? "font-medium" : "text-foreground/85"}>{f.label}</span>
                {f.weight && <span className="font-mono font-semibold shrink-0" style={{ color: penalty ? C_BAD : accent }}>{f.weight}</span>}
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground mt-2 pt-2 border-t border-border">{note}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* Headline metrics — one-line strip above the map. */
function MetricsStrip({ stats }: { stats: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-4 py-1.5 text-xs">
      {stats.map((s) => (
        <span key={s.label} className="inline-flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
          <span className="font-semibold tnum" style={s.color ? { color: s.color } : undefined}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}

export default function Scores() {
  const meta = pageByKey("Scores")!;
  const [search, setSearch] = useState("");
  const [asc, setAsc] = useState(false);
  const [view, setView] = useState<"map" | "table">("map"); // map default
  const [mapPopout, setMapPopout] = useState(false);        // fullscreen map modal
  const [kdePopout, setKdePopout] = useState(false);        // fullscreen KDE modal
  const [selected, setSelected] = useState<CountryWEI | null>(null);
  const [version, setVersion] = useState<ApiVersion>("v2");
  const [tierBy, setTierBy] = useState<"countries" | "women">("women");
  const [selectedIndex, setSelectedIndex] = useState<string>("SHE Score");
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [hoverTier, setHoverTier] = useState<number | null>(null);

  const { data: summary } = useQuery({ queryKey: ["summary"], queryFn: api.summary, staleTime: 5 * 60 * 1000 });
  const { data, isLoading, isError } = useQuery({ queryKey: ["scores-countries"], queryFn: () => api.wei.countries(250), staleTime: 5 * 60 * 1000 });

  const rawCountries = data?.data ?? [];
  // v3 (SHADOW) reweights the five live pillars; v2 is the published score.
  const countries = applyVersionList(rawCountries, version);
  const unavailable = !isLoading && (isError || rawCountries.length === 0);

  const rows = useMemo(() => {
    const list = countries.filter((c) => [c.country, c.iso_code, c.region].some((f) => (f ?? "").toLowerCase().includes(search.toLowerCase())));
    return [...list].sort((a, b) => (asc ? a.she_score - b.she_score : b.she_score - a.she_score));
  }, [countries, search, asc]);

  // Distribution by band (count + population), derived from each country's score.
  const tierData = useMemo(() => BAND_DEFS.map((b) => {
    const inBand = countries.filter((c) => bandKey(c.she_score) === b.key);
    return {
      name: b.label, count: inBand.length, color: b.color,
      pop: inBand.reduce((s, c) => s + (c.population_millions ?? 0), 0),
    };
  }), [countries]);
  const totalPop = useMemo(() => countries.reduce((s, c) => s + (c.population_millions ?? 0), 0), [countries]);
  // KDE-style distribution: real curve for SHE Score, analytic bells for companions.
  const distData = useMemo(() => {
    const XS = Array.from({ length: 51 }, (_, i) => i * 2);
    const she = countries.map((c) => c.she_score).filter((v) => v > 0);
    const kde = gaussianKDE(she, 6);
    const sheRaw = XS.map(kde);
    const sheMax = Math.max(...sheRaw, 1e-9);
    return XS.map((x, i) => {
      const row: Record<string, number | null> = { x };
      row["SHE Score"] = she.length ? (sheRaw[i] / sheMax) * 100 : null;
      COMPANION_INDEXES.forEach((idx) => { row[idx.code] = bellAt(x, idx.value, 18) * 100; });
      return row;
    });
  }, [countries]);

  const global = version === "v3" ? meanScore(countries) : (summary?.global_she_score ?? null);
  const totalC = countries.length;
  // Version-aware highest/lowest + band counts for the summary cards.
  const ranked = [...countries].sort((a, b) => b.she_score - a.she_score);
  const highC = ranked[0], lowC = ranked[ranked.length - 1];
  const highPlus = countries.filter((c) => (c.she_score ?? 0) >= 60).length;  // Very High + High
  const critical = countries.filter((c) => (c.she_score ?? 0) < 30).length;
  // Global average for each pillar (shown in the panel when no country is selected).
  const globalPillars = useMemo(() => {
    const out: Record<string, number> = {};
    PILLARS.forEach((p) => {
      const vals = countries.map((c) => (c as unknown as Record<string, number>)[p.field]).filter((v) => typeof v === "number");
      out[p.field] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    });
    return out;
  }, [countries]);

  // No country is selected on load — the panel shows the GLOBAL pillar breakdown,
  // and the index cards show global averages. Clicking a country switches to it.
  // Re-resolve the selected country against the versioned list (score is version-aware).
  const selectedDisplay = selected ? (countries.find((c) => c.iso_code === selected.iso_code) ?? selected) : null;

  // Cross-highlight: countries within ±2.5 of the hovered SHE Score → brighten on the map.
  const countriesNear = (score: number) => countries.filter((c) => Math.abs((c.she_score ?? 0) - score) <= 2.5);
  // The active band: hovering a donut slice (transient) wins over a clicked one (sticky).
  const activeTier = hoverTier ?? selectedTier;
  // Countries to brighten on the map: hovered-score neighbours (KDE/map hover), else
  // the active donut band.
  const highlightIsos = useMemo(() => {
    if (hoverScore != null) return new Set(countriesNear(hoverScore).map((c) => c.iso_code));
    if (activeTier != null) return new Set(countries.filter((c) => bandKey(c.she_score) === activeTier).map((c) => c.iso_code));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverScore, activeTier, countries]);
  // Donut slices to light up: bands of hovered countries, else the active band.
  const litTiers = useMemo(() => {
    if (hoverScore != null) return new Set(countriesNear(hoverScore).map((c) => bandKey(c.she_score)));
    if (activeTier != null) return new Set([activeTier]);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverScore, activeTier, countries]);
  // When a companion index is selected, shade the map by its (placeholder) per-country score.
  const companionOverride = useMemo(() => {
    if (selectedIndex === "SHE Score") return undefined;
    const idx = COMPANION_INDEXES.find((i) => i.code === selectedIndex);
    if (!idx) return undefined;
    return new Map(countries.map((c) => [c.iso_code, companionScore(c.iso_code, selectedIndex, idx.value)]));
  }, [selectedIndex, countries]);

  // Donut data labels pushed to the left/right edges (not over the plot) with
  // elbow leader lines, for readability.
  const RADIAN = Math.PI / 180;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sliceLabel = ({ cx, cy, midAngle, outerRadius, percent, index }: any) => {
    if (percent < 0.02) return null;
    const t = tierData[index];
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const right = cos >= 0;
    const labelX = cx + (right ? 1 : -1) * (outerRadius + 30);
    const labelY = cy + (outerRadius + 4) * sin;
    const anchor = right ? "start" : "end";
    return (
      <text x={labelX} y={labelY} fill={t.color} textAnchor={anchor} dominantBaseline="central">
        <tspan x={labelX} dy="-1.0em" fontSize={11} fontWeight={700}>{t.name}</tspan>
        <tspan x={labelX} dy="1.1em" fontSize={11} fontWeight={600}>{(percent * 100).toFixed(1)}%</tspan>
        <tspan x={labelX} dy="1.05em" fontSize={9} fontWeight={400} fill="hsl(var(--muted-foreground))">{womenM(t.pop).toLocaleString()}M women</tspan>
      </text>
    );
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaderLine = ({ cx, cy, midAngle, outerRadius, percent, index }: any) => {
    if (percent < 0.02) return <path />;
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const right = cos >= 0;
    const sx = cx + outerRadius * cos;                 // slice outer edge
    const sy = cy + outerRadius * sin;
    const my = cy + (outerRadius + 4) * sin;           // label row y
    const ex = cx + (right ? 1 : -1) * (outerRadius + 26);
    return <path d={`M${sx},${sy} L${sx + (right ? 6 : -6)},${my} L${ex},${my}`} stroke={tierData[index]?.color} strokeOpacity={0.5} fill="none" />;
  };

  // KDE hover: reads the SELECTED index at the hovered value. For SHE Score this
  // is the live band + the countries in that range; for a companion index it's
  // the index's reading (its per-country distribution is illustrative).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kdeTooltip = ({ active, label }: any) => {
    if (!active) return null;
    const v = Math.round(label);
    if (selectedIndex !== "SHE Score") {
      const idx = COMPANION_INDEXES.find((i) => i.code === selectedIndex);
      return (
        <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-card max-w-[260px]">
          <div className="font-semibold" style={{ color: INDEX_COLORS[selectedIndex] }}>{selectedIndex} ≈ {v}</div>
          {idx && <div className="text-muted-foreground mt-0.5">{idx.title} · global avg {idx.value.toFixed(1)}</div>}
          <div className="mt-1.5 pt-1.5 border-t border-border text-[11px] text-muted-foreground/70 italic">Illustrative companion distribution — per-country data pending.</div>
        </div>
      );
    }
    const near = countriesNear(label);
    const b = BANDS[bandKey(label)];
    return (
      <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-card max-w-[260px]">
        <div className="font-semibold" style={{ color: INDEX_COLORS["SHE Score"] }}>SHE Score ≈ {v}
          <span className="ml-1.5 font-medium" style={{ color: b.color }}>· {b.label}</span>
        </div>
        <div className="text-muted-foreground mt-0.5">{near.length} {near.length === 1 ? "country" : "countries"} in this range</div>
        {near.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border text-muted-foreground leading-relaxed">
            <span className="text-foreground/70 font-medium">Countries here:</span> {near.map((c) => c.country).join(", ")}
          </div>
        )}
      </div>
    );
  };
  const emph = (code: string) => selectedIndex === code;

  // KDE distribution card (placed in the left column under the map).
  // The KDE chart, reusable at any height (inline card + full-screen popout).
  // Reference lines are drawn AFTER the curves so the hover marker sits on top
  // of the densely-overlapping middle of the chart (otherwise it's hidden).
  const kdeChartEl = (height: number | string) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={distData} margin={{ left: -22, right: 22, top: 24, bottom: 0 }}
        onMouseMove={(s) => setHoverScore(typeof s?.activeLabel === "number" ? s.activeLabel : null)}
        onMouseLeave={() => setHoverScore(null)}>
        <XAxis dataKey="x" type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis hide domain={[0, 112]} />
        <RTooltip cursor={{ stroke: INDEX_COLORS[selectedIndex], strokeWidth: 1.5, strokeDasharray: "4 3" }} content={kdeTooltip} />
        <Line dataKey="SHE Score" type="monotone" stroke={INDEX_COLORS["SHE Score"]} strokeWidth={emph("SHE Score") ? 3.5 : 1.5} opacity={emph("SHE Score") ? 1 : 0.18} dot={false} activeDot={emph("SHE Score") ? { r: 4, stroke: "#fff", strokeWidth: 1.5 } : false} isAnimationActive={false} />
        {COMPANION_INDEXES.map((idx) => (
          <Line key={idx.code} dataKey={idx.code} type="monotone" stroke={INDEX_COLORS[idx.code]} strokeWidth={emph(idx.code) ? 3.5 : 1.5} opacity={emph(idx.code) ? 1 : 0.18} dot={false} activeDot={emph(idx.code) ? { r: 4, stroke: "#fff", strokeWidth: 1.5 } : false} isAnimationActive={false} />
        ))}
        {selectedDisplay && (
          <ReferenceLine x={selectedDisplay.she_score} stroke="#E0B84E" strokeDasharray="4 3"
            label={{ value: selectedDisplay.iso_code, fill: "#E0B84E", fontSize: 11, fontWeight: 700, position: "insideTop", offset: -16 }} />
        )}
        {hoverScore != null && (
          <ReferenceLine x={hoverScore} stroke={INDEX_COLORS[selectedIndex]} strokeWidth={2} strokeDasharray="3 3" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
  const kdeLegend = (
    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
      {["SHE Score", ...COMPANION_INDEXES.map((i) => i.code)].map((code) => (
        <span key={code} className="inline-flex items-center gap-1"><span className="h-0.5 w-3 rounded-full" style={{ background: INDEX_COLORS[code] }} />{code}</span>
      ))}
    </div>
  );
  const kdeIndexChip = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-2 py-0.5" style={{ color: INDEX_COLORS[selectedIndex], borderColor: `${INDEX_COLORS[selectedIndex]}66` }}>
        <span className="h-2 w-2 rounded-full" style={{ background: INDEX_COLORS[selectedIndex] }} /> {selectedIndex}
      </span>
      {selectedIndex !== "SHE Score" && (
        <button onClick={() => setSelectedIndex("SHE Score")} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
      )}
    </div>
  );

  const kdeCard = (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Score distributions · {totalC} countries
          {selectedDisplay && <span className="font-normal text-muted-foreground"> · {selectedDisplay.iso_code} {selectedDisplay.she_score?.toFixed(1)}</span>}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {kdeIndexChip}
          <button onClick={() => setKdePopout(true)} title="Expand chart" className="text-muted-foreground hover:text-foreground"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="mt-2">{kdeChartEl(188)}</div>
      {kdeLegend}
    </div>
  );

  // Tier distribution donut card.
  const donutCard = (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Distribution by category</h3>
        <div className="inline-flex rounded-md border border-border overflow-hidden text-[11px]">
          <button onClick={() => setTierBy("countries")} className={`px-2 py-1 ${tierBy === "countries" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}>Countries</button>
          <button onClick={() => setTierBy("women")} className={`px-2 py-1 border-l border-border ${tierBy === "women" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}>Women</button>
        </div>
      </div>
      <div className="relative mt-1">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart margin={{ top: 6, bottom: 6, left: 72, right: 72 }}>
            <Pie data={tierData} dataKey={tierBy === "women" ? "pop" : "count"} nameKey="name" cx="50%" cy="50%"
              innerRadius={40} outerRadius={58} paddingAngle={2} stroke="none" isAnimationActive={false}
              label={sliceLabel} labelLine={leaderLine} cursor="pointer"
              onMouseEnter={(_, i) => setHoverTier(i + 1)} onMouseLeave={() => setHoverTier(null)}
              onClick={(_, i) => setSelectedTier((t) => (t === i + 1 ? null : i + 1))}>
              {tierData.map((d, i) => {
                const tier = i + 1;
                const lit = litTiers?.has(tier);
                return <Cell key={d.name} fill={d.color} fillOpacity={litTiers && !lit ? 0.22 : 1} stroke={lit ? "#ffffff" : "none"} strokeWidth={lit ? 2 : 0} />;
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {tierBy === "women" ? (
            <><div className="font-serif text-xl font-bold tnum leading-none">{womenM(totalPop).toLocaleString()}M</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">women</div></>
          ) : (
            <><div className="font-serif text-2xl font-bold tnum leading-none">{totalC}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">countries</div></>
          )}
        </div>
      </div>
      <Link to="/compare" className="mt-1 inline-flex items-center gap-1 text-xs text-magenta-ink hover:underline">
        Compare countries <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );

  // Explore tiles (placed in the right column under the panel).
  const exploreTiles = (
    <>
      <Link to="/safety" className="group rounded-lg border border-border bg-card p-3 hover:border-magenta transition-smooth flex flex-col">
        <ShieldAlert className="h-5 w-5 text-magenta-ink" />
        <div className="mt-1.5 font-serif text-base font-semibold leading-tight">Women's safety map</div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">Travel-advisory view — country &amp; state level.</p>
        <span className="mt-auto pt-1.5 inline-flex items-center gap-1 text-xs text-magenta-ink">Open map <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></span>
      </Link>
      <Link to="/clock" className="group rounded-lg border border-border bg-card p-3 hover:border-magenta transition-smooth flex flex-col">
        <Clock className="h-5 w-5 text-magenta-ink" />
        <div className="mt-1.5 font-serif text-base font-semibold leading-tight">A day in the life</div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">The numbers for 100 girls in a single day.</p>
        <span className="mt-auto pt-1.5 inline-flex items-center gap-1 text-xs text-magenta-ink">Open figures <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></span>
      </Link>
    </>
  );

  // Reference card (Companion indexes + Sources) — placed under the charts in
  // the left column so it fills the space beside the taller right column.
  const referenceCard = (
    <div className="rounded-lg border border-border bg-card px-4 py-3 grid sm:grid-cols-[1.7fr_1fr] gap-x-6 gap-y-2 text-xs">
      <div>
        <h3 className="!text-base font-semibold !mb-1.5">Companion indexes</h3>
        <ul className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-0.5 leading-tight">
          {COMPANION_INDEXES.map((idx) => <li key={idx.code}><span className="font-semibold" style={{ color: INDEX_COLORS[idx.code] }}>{idx.code}</span> — {idx.title}</li>)}
        </ul>
        <p className="text-muted-foreground mt-1.5">Reference only; in development; never inputs to the SHE Score.</p>
      </div>
      <div>
        <h3 className="!text-base font-semibold !mb-1.5">Sources &amp; methodology</h3>
        <p className="text-muted-foreground leading-snug">Built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data. All scores normalised 0–100; higher is better for women. Scores are indicative and for research and awareness.</p>
        <Link to="/methodology" className="text-magenta-ink hover:underline mt-1.5 inline-block">Read the methodology →</Link>
      </div>
    </div>
  );

  // "The SHE Score" explainer tile — fills the right column under the explore
  // tiles (was an intro line above the headline).
  const sheScoreTile = (
    <div className="rounded-lg border border-border bg-card p-4 flex-1 flex flex-col justify-center">
      <h3 className="!text-base font-semibold !mb-1.5 flex items-center gap-2">
        The SHE Score
        {version === "v3" && <span className="text-[9px] font-bold uppercase tracking-widest text-gold border border-gold/50 rounded px-1 py-0.5">v3 shadow</span>}
      </h3>
      {version === "v3" ? (
        <p className="text-xs text-muted-foreground leading-snug">
          The <strong className="text-foreground">v3 (shadow)</strong> methodology reweights the five live pillars —
          Empowerment (20%), Education &amp; Literacy (15%), Economic Inclusion (25%), Health &amp; Survival (15%) and
          Safety (Crime Penalty, −25%) — so scores shift versus v2. Four further candidate pillars are still gathering
          data and contribute nothing yet. <strong className="text-foreground">v3 does not affect the published score.</strong>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground leading-snug">
          The published score (v2) is computed from five live pillars — Empowerment (25%), Education &amp; Literacy (20%),
          Economic Inclusion (20%), Health &amp; Survival (15%) and Safety (Crime Penalty, −20%). Four further pillars are
          in validation; published annually, quarterly for registered governments.
        </p>
      )}
    </div>
  );

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/scores`} />

      <div className="container max-w-7xl py-3 space-y-2.5">
        {/* Header — single compact bar */}
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="!text-xl md:!text-2xl !mb-0">
              Global SHE Score: <span className="tnum text-gold">{global != null ? global.toFixed(1) : "…"}</span>
              <span className="text-muted-foreground font-normal text-base"> / 100</span>
              {version === "v3" && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-widest text-gold border border-gold/50 rounded px-1.5 py-0.5">V3 SHADOW</span>}
            </h1>
            {global != null && (() => { const b = BANDS[bandKey(global)]; return (
              <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ color: b.color, background: `${b.color}22` }}>{b.label}</span>
            ); })()}
            <Link to="/explorer" title="Score calculator — see how the SHE Score changes when the pillar levers change"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:border-magenta hover:text-magenta-ink transition-smooth">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Test the levers
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-2.5 py-0.5 text-xs text-gold">
              <Sparkles className="h-3 w-3" /> {summary?.countries_scored ?? totalC} countries · 2025
            </span>
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            Methodology version
            <select value={version} onChange={(e) => setVersion(e.target.value as ApiVersion)}
              className={`h-8 rounded-md border bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${version === "v3" ? "border-gold/60 text-gold" : "border-border"}`}>
              <option value="v2">v2 — Official</option>
              <option value="v3">v3 — Shadow preview</option>
            </select>
          </label>
        </header>

        {/* v3 shadow banner — slim one-line strip */}
        {version === "v3" && (
          <div className="rounded-lg border border-dashed border-gold/50 bg-gold/[0.06] px-3 py-1.5 flex items-center gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-gold shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-gold">SHADOW — does not affect the published score.</strong> v3 reweights the five live pillars (heavier Economic Inclusion &amp; Safety, lighter Empowerment &amp; Education). Four candidate pillars are still gathering data.{" "}
              <Link to="/lab" className="text-gold hover:underline">The Lab →</Link>
            </span>
          </div>
        )}

        {/* Companion indexes (display-only) */}
        <section>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
            8 indexes · {selectedDisplay
              ? <>showing <span className="text-foreground font-medium normal-case">{selectedDisplay.country}</span>'s scores · <button onClick={() => setSelected(null)} className="text-magenta-ink hover:underline normal-case">← show global averages</button></>
              : "global averages · select a country to see its scores"} · click to filter · hover for methodology
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            <IndexCard
              code="SHE Score" desc="Women's Empowerment" native badge="NATIVE" color={INDEX_COLORS["SHE Score"]}
              value={selectedDisplay ? (selectedDisplay.she_score?.toFixed(1) ?? "—") : (global != null ? global.toFixed(1) : "—")}
              title={SHE_METHOD[version].title} formula={SHE_METHOD[version].formula} note={SHE_METHOD[version].note}
              selected={selectedIndex === "SHE Score"} onClick={() => setSelectedIndex("SHE Score")}
            />
            {COMPANION_INDEXES.map((idx) => (
              <IndexCard key={idx.code} code={idx.code} desc={idx.desc}
                value={selectedDisplay ? companionScore(selectedDisplay.iso_code, idx.code, idx.value).toFixed(1) : idx.value.toFixed(1)}
                color={INDEX_COLORS[idx.code]} badge={idx.code === "Compliance" ? "DERIVED" : undefined}
                title={idx.title} formula={idx.formula} note={idx.note}
                selected={selectedIndex === idx.code} onClick={() => setSelectedIndex(idx.code)} />
            ))}
          </div>
        </section>

        {/* Country Explorer */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
            <h2 className="text-base !mb-0">Country Explorer <span className="text-xs font-normal text-muted-foreground">{countries.length} countries</span></h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  className="h-8 w-44 rounded-md border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
                <button onClick={() => setView("map")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${view === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}><MapIcon className="h-4 w-4" /> Map</button>
                <button onClick={() => setView("table")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-l border-border ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-accent/40"}`}><TableIcon className="h-4 w-4" /> Table</button>
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
            <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-stretch">
              {/* LEFT: map + KDE/donut charts stacked under it */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                {selectedIndex !== "SHE Score" && (
                  <div className="mb-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                    Map shaded by <span className="font-medium" style={{ color: INDEX_COLORS[selectedIndex] }}>{selectedIndex}</span> — hover a country for its {selectedIndex} score.
                    <span className="italic"> Illustrative placeholder until live per-country data.</span>{" "}
                    <button onClick={() => setSelectedIndex("SHE Score")} className="text-magenta-ink hover:underline">Reset to SHE Score</button>
                  </div>
                )}
                {selectedTier != null ? (
                  <div className="mb-2 text-xs text-magenta-ink">
                    Showing <span className="font-medium">{BANDS[selectedTier].label}</span> · {countries.filter((c) => bandKey(c.she_score) === selectedTier).length} countries.{" "}
                    <button onClick={() => setSelectedTier(null)} className="hover:underline text-muted-foreground">Clear</button>
                  </div>
                ) : null}
                <div>
                  <WorldMap countries={countries} mapHeight={250} onSelect={setSelected} selectedIso={selected?.iso_code}
                    legendSide="left" onExpand={() => setMapPopout(true)}
                    mapHeader={<MetricsStrip stats={[
                      { label: "Highest", value: highC ? `${highC.country} ${highC.she_score.toFixed(1)}` : "—", color: C_GOOD },
                      { label: "Lowest", value: lowC ? `${lowC.country} ${lowC.she_score.toFixed(1)}` : "—", color: C_BAD },
                      { label: "High", value: `${highPlus} countries`, color: C_GOOD },
                      { label: "Critical", value: `${critical} countries`, color: C_BAD },
                    ]} />}
                    highlightIsos={highlightIsos} onHover={(c) => setHoverScore(c ? (c.she_score ?? null) : null)}
                    scoreOverride={companionOverride} indexLabel={selectedIndex !== "SHE Score" ? selectedIndex : "SHE Score"} />
                </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">{kdeCard}{donutCard}</div>
                {referenceCard}
              </div>
              {/* RIGHT: country panel + explore tiles (one row) */}
              <div className="flex flex-col gap-3">
                <SelectedPanel country={selectedDisplay} onClose={() => setSelected(null)} global={global} globalPillars={globalPillars} count={totalC} highPlus={highPlus} critical={critical} totalPop={totalPop} />
                <div className="grid grid-cols-2 gap-3">{exploreTiles}</div>
                {sheScoreTile}
              </div>
            </div>
          ) : (
            <>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="text-muted-foreground border-b border-border"><tr>
                  <th className="text-left font-medium px-4 py-3 w-12">#</th>
                  <th className="text-left font-medium px-4 py-3">Country</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Region</th>
                  <th className="text-left font-medium px-4 py-3"><button onClick={() => setAsc((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground">SHE Score <ArrowUpDown className="h-3 w-3" /></button></th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell w-28">Category</th>
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
                      <td className="px-4 py-2.5 hidden sm:table-cell">{(() => { const b = BANDS[bandKey(c.she_score)]; return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: b.color, background: `${b.color}1f` }}>{b.label}</span>; })()}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">{kdeCard}{donutCard}</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">{exploreTiles}</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">{referenceCard}{sheScoreTile}</div>
            </>
          )}
        </section>
      </div>

      {/* Full-screen map popout — more room to see every country in detail */}
      {mapPopout && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col p-4 sm:p-6"
          onClick={() => setMapPopout(false)}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <h2 className="text-lg !mb-0">World map · {countries.length} countries</h2>
              <p className="text-xs text-muted-foreground">SHE Score by country{selectedIndex !== "SHE Score" ? ` · shaded by ${selectedIndex}` : ""} · scroll to zoom, drag to pan</p>
            </div>
            <button onClick={() => setMapPopout(false)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-magenta transition-smooth">
              <X className="h-4 w-4" /> Close
            </button>
          </div>
          <div className="flex-1 min-h-0 rounded-xl border border-border bg-card p-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <WorldMap countries={countries} mapHeight={620} onSelect={(c) => { setSelected(c); }} selectedIso={selected?.iso_code}
              highlightIsos={highlightIsos} onHover={(c) => setHoverScore(c ? (c.she_score ?? null) : null)}
              scoreOverride={companionOverride} indexLabel={selectedIndex !== "SHE Score" ? selectedIndex : "SHE Score"} />
          </div>
        </div>
      )}

      {/* Full-screen KDE distribution popout */}
      {kdePopout && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col p-4 sm:p-6"
          onClick={() => setKdePopout(false)}>
          <div className="flex items-center justify-between mb-3 shrink-0 gap-3 flex-wrap">
            <div>
              <h2 className="text-lg !mb-0">Score distributions · {totalC} countries</h2>
              <p className="text-xs text-muted-foreground">Each curve is one index. Click an index card to highlight it; hover the chart to read the SHE Score band at any point.</p>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {kdeIndexChip}
              <button onClick={() => setKdePopout(false)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-magenta transition-smooth">
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-xl border border-border bg-card p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 min-h-0">{kdeChartEl("100%")}</div>
            {kdeLegend}
          </div>
        </div>
      )}
    </Layout>
  );
}

function SelectedPanel({ country, onClose, global, globalPillars, count, highPlus, critical, totalPop }: {
  country: CountryWEI | null; onClose: () => void; global: number | null; globalPillars: Record<string, number>; count: number; highPlus: number; critical: number; totalPop: number;
}) {
  if (!country) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24">
        <div className="text-xs text-muted-foreground">All scored countries · {count}</div>
        <div className="flex items-center gap-2">
          <div className="font-serif text-lg font-bold">World</div>
          {global != null && (() => { const b = BANDS[bandKey(global)]; return (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: b.color, background: `${b.color}1f` }}>{b.label}</span>
          ); })()}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="font-serif text-2xl font-bold tnum text-gold">{global != null ? global.toFixed(1) : "—"}</div>
          <div className="text-xs text-muted-foreground">SHE Score / 100</div>
        </div>
        {/* category summary — mirrors the country panel's tag row so the two
            panels (and therefore the map) stay the same height */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: C_GOOD, background: `${C_GOOD}1f` }}>{highPlus} High</span>
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: C_BAD, background: `${C_BAD}1f` }}>{critical} Critical</span>
          <span className="text-xs text-muted-foreground tnum">{womenM(totalPop).toLocaleString()}M women</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {PILLARS.map((p) => {
            const raw = globalPillars[p.field] ?? 0;
            return (
              <div key={p.key}>
                <div className="flex justify-between text-[11px] mb-0"><span>{p.label}</span><span className="tnum">{raw}</span></div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, raw))}%`, background: p.hex }} /></div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 rounded-md border border-dashed border-border px-4 py-1.5 text-sm text-center text-muted-foreground">
          Click a country for its breakdown
        </div>
      </div>
    );
  }
  // Share of the world's women — rounded to a whole percent (no decimal) to
  // keep the chip row on one line; tiny shares collapse to "<1%".
  const sharePct = (womenMexact(country.population_millions) / WORLD_WOMEN_M) * 100;
  const sharePctStr = sharePct >= 0.5 ? `${Math.round(sharePct)}%` : "<1%";
  return (
    <div className="rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{country.region} · Rank #{country.rank} · <span className="font-mono">{country.iso_code}</span></div>
          <div className="font-serif text-lg font-bold">{country.country}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="font-serif text-2xl font-bold tnum">{country.she_score?.toFixed(1)}</div>
        <div className="text-xs text-muted-foreground">SHE Score / 100</div>
      </div>

      {/* Category tag + women stats */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {(() => { const b = BANDS[bandKey(country.she_score)]; return (
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: b.color, background: `${b.color}1f` }}>
            {b.label}
          </span>
        ); })()}
        <span className="text-xs text-muted-foreground tnum">{fmtWomenM(country.population_millions)}M women <span className="text-foreground/55">({sharePctStr})</span></span>
      </div>

      <div className="mt-3 space-y-2.5">
        {PILLARS.map((p) => {
          const raw = (country as unknown as Record<string, number>)[p.field] ?? 0;
          return (
            <div key={p.key}>
              <div className="flex justify-between text-[11px] mb-0"><span>{p.label}</span><span className="tnum">{raw}</span></div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, raw))}%`, background: p.hex }} /></div>
            </div>
          );
        })}
      </div>
      <Link to={`/scores/${country.iso_code}`} className="mt-2 block text-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth">
        Full country profile →
      </Link>
    </div>
  );
}
