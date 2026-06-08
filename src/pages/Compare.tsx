import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { api, type CountryWEI } from "@/lib/api";
import { PILLARS } from "@/theme/pillars";
import { X } from "lucide-react";

const SLOT_COLORS = ["#E24D88", "#5FA0DB", "#5BC289"];

export default function Compare() {
  const meta = pageByKey("Compare")!;
  const { data } = useQuery({ queryKey: ["scores-countries"], queryFn: () => api.wei.countries(105), staleTime: 5 * 60 * 1000 });
  const countries = useMemo(() => [...(data?.data ?? [])].sort((a, b) => a.country.localeCompare(b.country)), [data]);
  const byIso = useMemo(() => new Map(countries.map((c) => [c.iso_code, c])), [countries]);

  const [isos, setIsos] = useState<string[]>([]);
  useEffect(() => {
    if (!isos.length && countries.length) {
      const pick = ["ISL", "IND", "USA"].filter((i) => byIso.has(i));
      setIsos(pick.length ? pick : countries.slice(0, 2).map((c) => c.iso_code));
    }
  }, [countries, byIso, isos.length]);

  const selected = isos.map((i) => byIso.get(i)).filter(Boolean) as CountryWEI[];
  const setSlot = (i: number, iso: string) => setIsos((cur) => cur.map((v, k) => (k === i ? iso : v)));
  const removeSlot = (i: number) => setIsos((cur) => cur.filter((_, k) => k !== i));
  const addSlot = () => { const next = countries.find((c) => !isos.includes(c.iso_code)); if (next && isos.length < 3) setIsos((c) => [...c, next.iso_code]); };

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/compare`} />
      <PageHero eyebrow="Compare" title="Compare countries side by side" lead="Put up to three countries next to each other across the SHE Score and its five pillars." />

      <div className="container max-w-4xl py-10">
        {/* Slots */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {isos.map((iso, i) => (
            <div key={i} className="rounded-lg border-2 bg-card p-3" style={{ borderColor: `${SLOT_COLORS[i]}66` }}>
              <div className="flex items-center justify-between gap-2">
                <select value={iso} onChange={(e) => setSlot(i, e.target.value)}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none">
                  {countries.map((c) => <option key={c.iso_code} value={c.iso_code}>{c.country}</option>)}
                </select>
                {isos.length > 1 && <button onClick={() => removeSlot(i)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>}
              </div>
              <div className="font-serif text-3xl font-bold tnum mt-1" style={{ color: SLOT_COLORS[i] }}>{byIso.get(iso)?.she_score?.toFixed(1) ?? "—"}</div>
              <div className="text-xs text-muted-foreground">SHE Score / 100 · {byIso.get(iso)?.region}</div>
            </div>
          ))}
          {isos.length < 3 && (
            <button onClick={addSlot} className="rounded-lg border-2 border-dashed border-border p-3 text-sm text-muted-foreground hover:border-magenta hover:text-magenta-ink transition-smooth">
              + Add a country
            </button>
          )}
        </div>

        {/* Pillar comparison */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-medium px-4 py-3">Pillar</th>
                {selected.map((c, i) => <th key={c.iso_code} className="text-right font-medium px-4 py-3" style={{ color: SLOT_COLORS[i] }}>{c.country}</th>)}
              </tr>
            </thead>
            <tbody>
              {PILLARS.map((p) => (
                <tr key={p.key} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium"><span className="inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle" style={{ background: p.hex }} />{p.label} <span className="text-xs text-muted-foreground">({p.weightLabel})</span></td>
                  {selected.map((c) => {
                    const v = (c as unknown as Record<string, number>)[p.field] ?? 0;
                    return <td key={c.iso_code} className="px-4 py-2.5 text-right tnum">{v}</td>;
                  })}
                </tr>
              ))}
              <tr className="bg-accent/30 font-semibold">
                <td className="px-4 py-3">SHE Score</td>
                {selected.map((c, i) => <td key={c.iso_code} className="px-4 py-3 text-right tnum" style={{ color: SLOT_COLORS[i] }}>{c.she_score?.toFixed(1)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="source-line">
          Source: SHE Score v2. The Safety value is a crime penalty subtracted from the composite.{" "}
          <Link to="/scores" className="text-magenta-ink hover:underline">Back to all scores →</Link>
        </p>
      </div>
    </Layout>
  );
}
