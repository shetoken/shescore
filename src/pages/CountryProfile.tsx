import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { CountrySEO } from "@/lib/seo";
import { api, type CountryWEI } from "@/lib/api";
import { PILLARS } from "@/theme/pillars";
import { ArrowLeft } from "lucide-react";

export default function CountryProfile() {
  const { iso } = useParams<{ iso: string }>();
  const { data: c, isLoading, isError } = useQuery({
    queryKey: ["country", iso],
    queryFn: () => api.wei.country(iso!),
    enabled: !!iso,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Layout>
      {c && <CountrySEO country={c.country} iso={c.iso_code} score={Number(c.she_score?.toFixed(1) ?? 0)} region={c.region} />}
      <div className="container max-w-3xl py-10">
        <Link to="/scores" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-magenta-ink mb-6">
          <ArrowLeft className="h-4 w-4" /> All scores
        </Link>

        {isLoading ? (
          <p className="text-muted-foreground py-16 text-center">Loading…</p>
        ) : isError || !c ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="font-medium">This country profile is temporarily unavailable.</p>
            <Link to="/scores" className="mt-2 inline-block text-sm text-magenta-ink hover:underline">Back to all scores</Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-magenta-ink mb-2">{c.region} · Rank #{c.rank}</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h1>{c.country}</h1>
              <div className="text-right">
                <div className="font-serif text-5xl font-bold tnum">{c.she_score?.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">SHE Score / 100</div>
              </div>
            </div>

            <h2 className="mt-10 text-xl">Pillar breakdown</h2>
            <div className="mt-4 space-y-3">
              {PILLARS.map((p) => {
                const raw = (c as unknown as Record<string, number>)[p.field] ?? 0;
                const display = p.penalty ? raw : raw; // show the raw sub-score
                const contribution = Math.round(raw * p.weight * 10) / 10;
                return (
                  <div key={p.key}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.hex }} />
                        {p.label} <span className="text-xs text-muted-foreground">({p.weightLabel})</span>
                      </span>
                      <span className="tnum">
                        {display}/100 <span className="text-muted-foreground">· {contribution > 0 ? "+" : ""}{contribution} pts</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, display))}%`, background: p.hex }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="source-line mt-8">
              Source: SHE Score v2. The Safety value is a crime penalty subtracted from the composite.{" "}
              <Link to="/methodology" className="text-magenta-ink hover:underline">How this is computed →</Link>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
