import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { WorldMap } from "@/components/WorldMap";
import { StateChoroplethMap, stateKey, type CityLabel } from "@/components/StateChoroplethMap";
import { pageByKey, SITE } from "@/config/manifest";
import { api } from "@/lib/api";
import { ShieldAlert, Phone, MapPin, Search, Info, Moon, Users, Ban, ArrowRight } from "lucide-react";

/* Advisory tiers from the Safety & Justice score (0–100, higher = safer). */
interface Advisory { tier: number; label: string; action: string; color: string; Icon: typeof Ban; }
function advisoryFor(score: number): Advisory {
  if (score >= 65) return { tier: 1, label: "Generally safe", color: "#10b981", Icon: ShieldAlert,
    action: "Take the everyday precautions you would anywhere. Solo travel is generally fine." };
  if (score >= 48) return { tier: 2, label: "Don't walk alone after dark", color: "#eab308", Icon: Moon,
    action: "Avoid isolated areas at night, use registered transport, and keep someone updated on your location." };
  if (score >= 35) return { tier: 3, label: "Avoid travelling alone", color: "#f97316", Icon: Users,
    action: "Travel with companions where possible and avoid solo trips — especially after dark." };
  return { tier: 4, label: "Reconsider non-essential travel", color: "#ef4444", Icon: Ban,
    action: "Exercise extreme caution. Solo travel carries high risk; arrange trusted local contacts before arrival." };
}

/* Women's helplines (major countries) — fallback to local emergency services. */
const HELPLINES: Record<string, { name: string; number: string }> = {
  IND: { name: "Women Helpline (India)",         number: "181 / 1091" },
  USA: { name: "National DV Hotline (US)",       number: "1-800-799-7233" },
  GBR: { name: "Refuge / National DV (UK)",      number: "0808 2000 247" },
  CAN: { name: "Assaulted Women's Helpline",     number: "1-866-863-0511" },
  AUS: { name: "1800RESPECT (Australia)",        number: "1800 737 732" },
  ZAF: { name: "GBV Command Centre (S. Africa)", number: "0800 428 428" },
  NGA: { name: "DSVRT (Lagos, Nigeria)",         number: "0800 033 3333" },
  KEN: { name: "GVRC / Healthcare (Kenya)",      number: "1195" },
  PAK: { name: "Madadgaar Helpline (Pakistan)",  number: "1098" },
  BGD: { name: "National Helpline (Bangladesh)", number: "109" },
  BRA: { name: "Central de Atendimento (Brazil)",number: "180" },
  MEX: { name: "Línea de las Mujeres (Mexico)",  number: "800 822 4460" },
};

const TIPS = [
  "Share your live location with a trusted contact.",
  "Prefer registered taxis / ride-apps over hailing on the street.",
  "Avoid poorly-lit or isolated routes after dark.",
  "Keep emergency numbers saved and reachable on a locked screen.",
  "Trust your instinct — leave any situation that feels unsafe.",
];

/* Countries with sub-national (state) data: ISO → baseline dataset name. */
const SUBNATIONAL: Record<string, string> = {
  IND: "india", USA: "usa", BRA: "brazil", NGA: "nigeria", MEX: "mexico", PAK: "pakistan",
};

/* Key city label per Indian state (lng, lat) overlaid on the choropleth. */
const INDIA_CITIES: CityLabel[] = [
  { city: "Kochi", state: "Kerala", coords: [76.27, 9.93] }, { city: "Panaji", state: "Goa", coords: [73.83, 15.49] },
  { city: "Chennai", state: "Tamil Nadu", coords: [80.27, 13.08] }, { city: "Aizawl", state: "Mizoram", coords: [92.72, 23.73] },
  { city: "Shillong", state: "Meghalaya", coords: [91.88, 25.57] }, { city: "Lucknow", state: "Uttar Pradesh", coords: [80.95, 26.85] },
  { city: "Patna", state: "Bihar", coords: [85.14, 25.61] }, { city: "Bhopal", state: "Madhya Pradesh", coords: [77.41, 23.26] },
  { city: "Ranchi", state: "Jharkhand", coords: [85.31, 23.34] }, { city: "Guwahati", state: "Assam", coords: [91.75, 26.14] },
  { city: "Jaipur", state: "Rajasthan", coords: [75.79, 26.91] }, { city: "Gurugram", state: "Haryana", coords: [77.03, 28.46] },
  { city: "Raipur", state: "Chhattisgarh", coords: [81.63, 21.25] }, { city: "Bhubaneswar", state: "Odisha", coords: [85.82, 20.30] },
  { city: "New Delhi", state: "Delhi", coords: [77.21, 28.61] }, { city: "Ahmedabad", state: "Gujarat", coords: [72.57, 23.03] },
  { city: "Kolkata", state: "West Bengal", coords: [88.36, 22.57] }, { city: "Mumbai", state: "Maharashtra", coords: [72.88, 19.08] },
  { city: "Ludhiana", state: "Punjab", coords: [75.86, 30.90] }, { city: "Hyderabad", state: "Telangana", coords: [78.49, 17.39] },
  { city: "Bengaluru", state: "Karnataka", coords: [77.59, 12.97] }, { city: "Visakhapatnam", state: "Andhra Pradesh", coords: [83.22, 17.69] },
  { city: "Dehradun", state: "Uttarakhand", coords: [78.03, 30.32] }, { city: "Shimla", state: "Himachal Pradesh", coords: [77.17, 31.10] },
];

/* Per-country choropleth config (state polygons via public topojson). */
const CHOROPLETH: Record<string, { geoUrl: string; nameKey: string; projection: string; projectionConfig: Record<string, unknown>; cities?: CityLabel[] }> = {
  IND: { geoUrl: "https://cdn.jsdelivr.net/gh/Anujarya300/bubble_maps@master/data/geography-data/india.topo.json",
    nameKey: "name", projection: "geoMercator", projectionConfig: { scale: 1000, center: [82.5, 22.8] }, cities: INDIA_CITIES },
  USA: { geoUrl: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    nameKey: "name", projection: "geoAlbersUsa", projectionConfig: { scale: 1000 } },
};

export default function Safety() {
  const meta = pageByKey("Safety")!;
  const [search, setSearch] = useState("");
  const [selIso, setSelIso] = useState("IND");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [stateSort, setStateSort] = useState<"least" | "safest" | "name">("least");

  const { data: countriesRes, isLoading } = useQuery({ queryKey: ["safety-countries"], queryFn: () => api.wei.countries(105), staleTime: 10 * 60 * 1000 });
  const countries = useMemo(() => countriesRes?.data ?? [], [countriesRes]);

  const scoreOverride = useMemo(() => new Map(countries.map((c) => [c.iso_code, c.safety_justice_score ?? 0])), [countries]);
  const sel = countries.find((c) => c.iso_code === selIso) ?? countries[0];
  useEffect(() => { if (!sel && countries.length) setSelIso(countries[0].iso_code); }, [sel, countries]);

  const ranked = useMemo(() =>
    [...countries]
      .filter((c) => c.country.toLowerCase().includes(search.toLowerCase()) || c.iso_code.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.safety_justice_score ?? 0) - (b.safety_justice_score ?? 0)),
    [countries, search]);

  const adv = sel ? advisoryFor(sel.safety_justice_score ?? 0) : null;
  const helpline = sel ? HELPLINES[sel.iso_code] : undefined;

  const subName = sel ? SUBNATIONAL[sel.iso_code] : undefined;
  const { data: statesRes, isLoading: loadingStates } = useQuery({
    queryKey: ["safety-states", subName], queryFn: () => api.wei.states(subName!), enabled: !!subName, staleTime: 30 * 60 * 1000,
  });
  const states = useMemo(() => {
    const list = [...(statesRes?.data ?? [])];
    if (stateSort === "safest") return list.sort((a, b) => (b.safety_justice_score ?? 0) - (a.safety_justice_score ?? 0));
    if (stateSort === "name") return list.sort((a, b) => a.state.localeCompare(b.state));
    return list.sort((a, b) => (a.safety_justice_score ?? 0) - (b.safety_justice_score ?? 0));
  }, [statesRes, stateSort]);

  const LEGEND = [
    { c: "#10b981", t: "Generally safe" }, { c: "#eab308", t: "Don't walk alone after dark" },
    { c: "#f97316", t: "Avoid travelling alone" }, { c: "#ef4444", t: "Reconsider non-essential travel" },
  ];

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/safety`} />
      <PageHero
        eyebrow="Women's travel safety advisory"
        title="Where is it safe to travel — as a woman?"
        lead={<>A country-level safety advisory for women, built from each country's <strong className="text-foreground">Safety &amp; Justice</strong> score (WHO, UNODC, UN Women). Click a country for its advisory and local helpline.</>}
      />

      <div className="container max-w-7xl py-10 space-y-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {LEGEND.map((l) => (
            <span key={l.t} className="flex items-center gap-1.5 text-muted-foreground"><span className="w-3 h-3 rounded-sm" style={{ background: l.c }} /> {l.t}</span>
          ))}
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-3 h-3 rounded-sm" style={{ background: "#1e293b" }} /> No data</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading safety data…</div>
        ) : (
          <div className="grid xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-8">
              <WorldMap countries={countries} selectedIso={selIso} onSelect={(c) => setSelIso(c.iso_code)}
                scoreOverride={scoreOverride} colorFor={(s) => (s == null ? "#1e293b" : advisoryFor(s).color)}
                hideLegend indexLabel="Safety" mapHeight={420} subnationalIsos={new Set(Object.keys(SUBNATIONAL))} />
            </div>
            <div className="xl:col-span-4">
              {sel && adv && (
                <div className="rounded-2xl border p-5 shadow-card" style={{ borderColor: `${adv.color}55`, background: `${adv.color}0d` }}>
                  <div className="text-xs text-muted-foreground mb-0.5">{sel.region}</div>
                  <div className="font-serif text-2xl font-bold mb-2">{sel.country}</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm mb-3" style={{ background: `${adv.color}1f`, color: adv.color, border: `1px solid ${adv.color}40` }}>
                    <adv.Icon className="h-4 w-4" /> {adv.label}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{adv.action}</p>
                  <div className="text-xs flex justify-between mb-4">
                    <span className="text-muted-foreground">Safety &amp; Justice score</span>
                    <span className="font-semibold" style={{ color: adv.color }}>{(sel.safety_justice_score ?? 0).toFixed(0)}/100</span>
                  </div>
                  <div className="rounded-lg bg-card border border-border/40 p-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold mb-1"><Phone className="h-3.5 w-3.5 text-magenta-ink" /> Women's helpline</div>
                    {helpline ? (
                      <div className="text-sm"><span className="font-bold text-magenta-ink">{helpline.number}</span><span className="text-muted-foreground"> · {helpline.name}</span></div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Dial local emergency services. Save them before you travel.</div>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-magenta-ink" /> Stay-safe tips</div>
                    <ul className="space-y-1 text-muted-foreground">
                      {TIPS.slice(0, 4).map((t) => <li key={t} className="flex gap-1.5"><span className="text-magenta-ink">·</span>{t}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-national drill-down */}
        {subName && (
          <section>
            <h2 className="text-xl !mb-1">Inside {sel?.country} — state advisories</h2>
            <p className="text-xs text-muted-foreground mb-4">Safety varies hugely within a country. {sel?.country}'s {SUBNATIONAL[sel?.iso_code ?? ""] === "pakistan" ? "provinces" : "states"} ranked least safe first.</p>
            {loadingStates ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading state data…</div>
            ) : sel && CHOROPLETH[sel.iso_code] ? (
              <div className="grid lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2">
                  <StateChoroplethMap key={sel.iso_code} geoUrl={CHOROPLETH[sel.iso_code].geoUrl} nameKey={CHOROPLETH[sel.iso_code].nameKey}
                    projection={CHOROPLETH[sel.iso_code].projection} projectionConfig={CHOROPLETH[sel.iso_code].projectionConfig}
                    cities={CHOROPLETH[sel.iso_code].cities} states={states} advisoryFor={advisoryFor} hoveredKey={hoveredKey} onHoverKey={setHoveredKey} />
                </div>
                <div className="lg:col-span-1 rounded-2xl border border-border/40 bg-card shadow-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">{states.length} states</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      {([{ k: "least", t: "Least safe" }, { k: "safest", t: "Safest" }, { k: "name", t: "A–Z" }] as const).map((o) => (
                        <button key={o.k} onClick={() => setStateSort(o.k)} className={`px-1.5 py-0.5 rounded transition-colors ${stateSort === o.k ? "bg-magenta/20 text-magenta-ink font-semibold" : "text-muted-foreground hover:text-foreground"}`}>{o.t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto divide-y divide-border/20">
                    {states.map((st) => {
                      const a = advisoryFor(st.safety_justice_score ?? 0); const k = stateKey(st.state); const isHi = hoveredKey === k;
                      return (
                        <div key={st.state_code ?? st.state} onMouseEnter={() => setHoveredKey(k)} onMouseLeave={() => setHoveredKey(null)}
                          className="flex items-center gap-2 px-3 py-1.5 cursor-default transition-colors" style={{ background: isHi ? `${a.color}1f` : "transparent" }}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                          <div className="min-w-0 flex-1"><div className="text-xs font-semibold truncate">{st.state}</div><div className="text-[10px] leading-tight truncate" style={{ color: a.color }}>{a.label}</div></div>
                          <span className="text-[10px] font-medium text-muted-foreground shrink-0">{Number(st.safety_justice_score ?? 0).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {states.map((st) => {
                  const a = advisoryFor(st.safety_justice_score ?? 0);
                  return (
                    <div key={st.state_code ?? st.state} className="rounded-xl border border-border/40 bg-card p-3 shadow-card">
                      <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{st.state}</span><span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} /></div>
                      <div className="text-xs leading-tight" style={{ color: a.color }}>{a.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Safety {Number(st.safety_justice_score ?? 0).toFixed(0)}/100</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Ranked list */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-xl !mb-0">Country advisories <span className="text-sm text-muted-foreground font-normal">least safe first</span></h2>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search country…" className="w-full pl-9 h-9 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ranked.slice(0, 30).map((c) => {
              const a = advisoryFor(c.safety_justice_score ?? 0);
              return (
                <button key={c.iso_code} onClick={() => { setSelIso(c.iso_code); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="text-left rounded-xl border border-border/40 bg-card p-3 shadow-card hover:border-magenta transition-smooth">
                  <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{c.country}</span><span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} /></div>
                  <div className="text-xs" style={{ color: a.color }}>{a.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Safety {Number(c.safety_justice_score ?? 0).toFixed(0)}/100</div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link to="/scores" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">← Back to the dashboard</Link>
          <Link to="/clock" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">A day in the life <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <p className="text-[11px] text-muted-foreground/60 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          Advisory derived from country-level data (WHO, UNODC, UN Women) — it reflects documented risk, not a guarantee, and
          cannot account for specific neighbourhoods or situations. It is guidance for preparedness, not a substitute for official
          government travel advisories. Always check local sources.
        </p>
      </div>
    </Layout>
  );
}
