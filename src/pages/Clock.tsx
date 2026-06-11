import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { pillarByKey } from "@/theme/pillars";
import { api, type VitalStats } from "@/lib/api";
import { Clock as ClockIcon, Info, ArrowRight } from "lucide-react";

const WEEK_SECONDS = 7 * 24 * 3600;
const C_HOPE = "#5BC289";
const C_HARM = "#E0606A";

interface Metric { key: keyof VitalStats; label: string; tone: "hope" | "harm"; }
const METRICS: Metric[] = [
  { key: "girls_born_per_week_est",              label: "A girl is born",                   tone: "hope" },
  { key: "girls_drop_out_school_per_week_est",   label: "A girl drops out of school",       tone: "harm" },
  { key: "girls_married_under18_per_week_est",   label: "A girl is married before 18",      tone: "harm" },
  { key: "women_killed_by_partner_per_week_est", label: "A woman is killed by her partner", tone: "harm" },
  { key: "maternal_deaths_per_week_est",         label: "A mother dies in childbirth",      tone: "harm" },
];

const SLOTS = [
  { default: "IND", color: "#E0B84E" },
  { default: "USA", color: "#a855f7" },
  { default: "ISL", color: "#06b6d4" },
];

const toneColor = (t: "hope" | "harm") => (t === "hope" ? C_HOPE : C_HARM);
const ratePerSec = (v: VitalStats | undefined, key: keyof VitalStats) => (Number(v?.[key] ?? 0) || 0) / WEEK_SECONDS;
const fmtTally = (n: number) => Math.floor(n).toLocaleString("en-US");

/** seconds elapsed since local midnight ("today, so far"). */
function secondsToday(): number {
  const now = new Date();
  const mid = new Date(now); mid.setHours(0, 0, 0, 0);
  return (now.getTime() - mid.getTime()) / 1000;
}
function cadence(r: number): string {
  if (!r || r <= 0) return "none recorded";
  const s = 1 / r;
  if (s < 1)    return `${(1 / s).toFixed(1)} every second`;
  if (s < 60)   return `one every ${s.toFixed(0)}s`;
  if (s < 3600) return `one every ${(s / 60).toFixed(0)} min`;
  if (s < 86400) return `one every ${(s / 3600).toFixed(1)} hr`;
  return `one every ${(s / 86400).toFixed(1)} days`;
}
const pulsing = (rate: number, elapsed: number) =>
  rate > 0 && Math.floor(rate * elapsed) > Math.floor(rate * (elapsed - 0.25));

/* Scrolling "lifeline" — blip density = the rate. */
function PulseLine({ rate, elapsed, color, w = 130, h = 28 }: { rate: number; elapsed: number; color: string; w?: number; h?: number; }) {
  const mid = h / 2, amp = h * 0.42, T = 18, px = w / T;
  if (rate <= 0) return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <line x1={0} y1={mid} x2={w} y2={mid} stroke={color} strokeOpacity={0.22} strokeWidth={1.2} />
    </svg>
  );
  const period = 1 / rate;
  const kEnd = Math.floor(elapsed / period);
  const kStart = Math.max(0, Math.ceil((elapsed - T) / period));
  const spikes: number[] = [];
  for (let k = kStart; k <= kEnd; k++) spikes.push(w - (elapsed - k * period) * px);
  spikes.sort((a, b) => a - b);
  const pts: string[] = [`0,${mid}`];
  for (const x of spikes) pts.push(`${(x - 4).toFixed(1)},${mid}`, `${(x - 1.5).toFixed(1)},${mid}`,
    `${x.toFixed(1)},${(mid - amp).toFixed(1)}`, `${(x + 1.5).toFixed(1)},${mid}`, `${(x + 4).toFixed(1)},${mid}`);
  pts.push(`${w},${mid}`);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={w - 1} cy={mid} r={1.8} fill={color} />
    </svg>
  );
}

function HeroDial({ name, label, rate, elapsed }: { name: string; label: string; rate: number; elapsed: number; }) {
  const period = rate > 0 ? 1 / rate : 0;
  const events = Math.floor(rate * elapsed);
  const frac = period > 0 ? (elapsed % period) / period : 0;
  const rad = (frac * 360 - 90) * (Math.PI / 180);
  const cx = 80, cy = 80, R = 68;
  const hx = cx + Math.cos(rad) * R * 0.8, hy = cy + Math.sin(rad) * R * 0.8;
  const flash = period > 0 && (elapsed % period) < 0.3;
  return (
    <div className="flex flex-col items-center text-center">
      <svg width={160} height={160}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(222 14% 30%)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C_HARM} strokeWidth={3} strokeOpacity={flash ? 0.9 : 0.18} style={{ transition: "stroke-opacity .15s" }} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          return <line key={i} x1={cx + Math.cos(a) * R} y1={cy + Math.sin(a) * R} x2={cx + Math.cos(a) * (R - 6)} y2={cy + Math.sin(a) * (R - 6)} stroke="hsl(222 10% 50%)" strokeWidth={1.4} />;
        })}
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={C_HARM} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={C_HARM} />
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize={26} fontWeight={700} fill={C_HARM} className="font-serif">{events.toLocaleString("en-US")}</text>
      </svg>
      <div className="text-sm font-semibold mt-1">{label}</div>
      <div className="text-xs text-muted-foreground">in {name} · {cadence(rate)}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{events.toLocaleString("en-US")} today so far</div>
    </div>
  );
}

const FIGURES: { n: number; headline: string; detail: string; pillar: string; source: string }[] = [
  { n: 19, headline: "marry as children", detail: "before their 18th birthday — about 1 in 5.", pillar: "empowerment", source: "UNICEF" },
  { n: 13, headline: "leave school early", detail: "won't complete secondary education.", pillar: "education", source: "UNESCO" },
  { n: 53, headline: "are shut out of paid work", detail: "are not in the formal labour force.", pillar: "economic", source: "ILO" },
  { n: 27, headline: "will face violence", detail: "from an intimate partner in their lifetime.", pillar: "safety", source: "WHO" },
  { n: 73, headline: "have little political voice", detail: "live where women hold under a third of seats.", pillar: "empowerment", source: "IPU" },
];

export default function Clock() {
  const meta = pageByKey("Clock")!;
  const [isos, setIsos] = useState<string[]>(SLOTS.map((s) => s.default));
  const [elapsed, setElapsed] = useState(secondsToday());

  useEffect(() => {
    const id = setInterval(() => setElapsed(secondsToday()), 200);
    return () => clearInterval(id);
  }, []);

  const { data: vitals } = useQuery({ queryKey: ["vital-all"], queryFn: () => api.vital.all(), staleTime: 30 * 60 * 1000 });
  const byIso = useMemo(() => new Map((vitals ?? []).map((v) => [v.iso_code, v])), [vitals]);
  const list = useMemo(() => (vitals ?? []).map((v) => ({ iso_code: v.iso_code, country: v.country })).sort((a, b) => a.country.localeCompare(b.country)), [vitals]);
  const data: (VitalStats | undefined)[] = isos.map((iso) => byIso.get(iso));
  const setIso = (i: number, iso: string) => setIsos((p) => p.map((v, j) => (j === i ? iso : v)));

  const hero = useMemo(() => {
    const A = data[0];
    let best: { m: Metric; rate: number } | null = null;
    for (const m of METRICS) {
      if (m.tone !== "harm") continue;
      const r = ratePerSec(A, m.key);
      if (!best || r > best.rate) best = { m, rate: r };
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data[0]]);

  const clock = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/clock`} />
      <PageHero
        eyebrow="A day in the life · live"
        title="What happens to girls — today"
        lead={<>Counts so far <strong className="text-foreground">today</strong> (since local midnight), ticking by the second from each country's latest annual rates. Compare three countries side by side. As of <span className="font-mono text-magenta-ink">{clock}</span>.</>}
      />

      <div className="container max-w-5xl py-10 space-y-8">
        {/* Hero dial — country A's most frequent harm */}
        {hero && hero.rate > 0 && (
          <div className="flex justify-center">
            <div className="rounded-2xl border border-[#E0606A]/30 bg-card px-8 py-5 shadow-card">
              <HeroDial name={data[0]?.country ?? isos[0]} label={hero.m.label} rate={hero.rate} elapsed={elapsed} />
            </div>
          </div>
        )}

        {/* Country pickers */}
        <section>
          <div className="grid grid-cols-3 gap-3 mb-2">
            {SLOTS.map((s, i) => (
              <select key={i} value={isos[i]} onChange={(e) => setIso(i, e.target.value)}
                className="bg-card border rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none w-full"
                style={{ borderColor: `${s.color}55`, color: s.color }}>
                {list.map((c) => <option key={c.iso_code} value={c.iso_code} className="bg-card text-foreground">{c.country}</option>)}
              </select>
            ))}
          </div>

          <div className="space-y-3">
            {METRICS.map((m) => {
              const col = toneColor(m.tone);
              return (
                <div key={String(m.key)} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: col }} />
                    <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {data.map((d, i) => {
                      const r = ratePerSec(d, m.key);
                      const pulse = pulsing(r, elapsed);
                      return (
                        <div key={i} className="text-center">
                          <div className="font-serif text-2xl font-bold tnum"
                            style={{ color: col, transform: pulse ? "scale(1.16)" : "scale(1)", textShadow: pulse ? `0 0 12px ${col}` : "none", transition: "transform .15s, text-shadow .15s" }}>
                            {fmtTally(r * elapsed)}
                          </div>
                          <div className="text-[9px] text-muted-foreground/70 leading-tight mb-1">{cadence(r)}</div>
                          <PulseLine rate={r} elapsed={elapsed} color={col} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground/60 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            A narrative device, not a live feed: counts are today's accumulation (since local midnight) from each country's
            latest annual rates (UN Population Division, WHO, UNICEF, UNODC, UN Women). "None recorded" means the annual figure
            rounds to zero — not that it never happens. Vital counts are identical across methodology versions.
          </p>
        </section>

        {/* The bigger picture — of every 100 girls */}
        <section>
          <h2 className="text-xl mb-1 flex items-center gap-2"><ClockIcon className="h-5 w-5 text-magenta-ink" /> Of every 100 girls</h2>
          <p className="text-sm text-muted-foreground mb-4">The lifetime odds behind the clock — global averages, each tied to a SHE Score pillar.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIGURES.map((f) => {
              const p = pillarByKey(f.pillar)!;
              return (
                <div key={f.headline} className="rounded-lg border border-border bg-card p-5 flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-4xl font-bold tnum leading-none" style={{ color: p.hex }}>{f.n}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <div className="mt-2 font-serif text-base font-semibold leading-tight">{f.headline}</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug flex-1">{f.detail}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: p.hex }}><span className="h-2 w-2 rounded-full" style={{ background: p.hex }} />{p.label}</span>
                    <span className="text-muted-foreground">{f.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link to="/scores" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">See the country scores <ArrowRight className="h-3.5 w-3.5" /></Link>
          <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-magenta-ink hover:underline">The women's safety map <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <p className="source-line">Sources: UN Population Division, WHO, UNICEF, UNODC, UN Women, ILO, UNESCO, IPU — latest available annual rates, illustrative. Published by {SITE.publisher}.</p>
      </div>
    </Layout>
  );
}
