import { useState } from "react";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { PILLARS } from "@/theme/pillars";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, RotateCcw } from "lucide-react";

/* West Bengal worked-example baseline → 39.1 (see /methodology). */
const BASELINE: Record<string, number> = {
  empowerment: 52, education: 67, economic: 52, health: 71, safety: 42,
};
const CRISIS_THRESHOLD = BASELINE.safety * 1.15; // crime index >15% above baseline

const roundHalfUp = (x: number) => Math.sign(x) * Math.round(Math.abs(x) * 10) / 10;

function scoreOf(v: Record<string, number>) {
  // safety is a penalty (negative weight); PILLARS carries the signed weight.
  const raw = PILLARS.reduce((s, p) => s + v[p.key] * p.weight, 0);
  return roundHalfUp(raw);
}

export default function Explorer() {
  const meta = pageByKey("Explorer")!;
  const [vals, setVals] = useState<Record<string, number>>({ ...BASELINE });

  const score = scoreOf(vals);
  const baseScore = scoreOf(BASELINE);
  const delta = roundHalfUp(score - baseScore);
  const crisis = vals.safety > CRISIS_THRESHOLD;

  const set = (k: string, n: number) => setVals((v) => ({ ...v, [k]: n }));
  const reset = () => setVals({ ...BASELINE });
  const kanyashree = () => setVals({ ...BASELINE, education: 76 }); // +1.8

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/explorer`} />
      <PageHero
        eyebrow="Score Explorer"
        title="See how the SHE Score responds"
        lead="Adjust the five LIVE pillars and watch the v2 score recompute, live, from the published formula."
      />

      {/* Illustrative banner */}
      <div className="container max-w-4xl pt-8">
        <div className="rounded-md border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm">
          <strong className="text-magenta-ink">Illustrative</strong> — adjust the pillars to see how the score responds.
          Starting point is the West Bengal worked example (39.1).
        </div>
      </div>

      <div className="container max-w-4xl py-8 grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        {/* Sliders */}
        <div className="space-y-7">
          {PILLARS.map((p) => {
            const contribution = roundHalfUp(vals[p.key] * p.weight);
            return (
              <div key={p.key}>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.hex }} />
                    {p.label}
                    <span className="text-xs text-muted-foreground">({p.weightLabel})</span>
                  </label>
                  <span className="text-sm tnum">
                    <span className="font-semibold">{vals[p.key]}</span>
                    <span className="text-muted-foreground"> · {contribution > 0 ? "+" : ""}{contribution} pts</span>
                  </span>
                </div>
                <Slider
                  value={[vals[p.key]]}
                  min={0} max={100} step={1}
                  onValueChange={([n]) => set(p.key, n)}
                  aria-label={p.label}
                />
                {p.penalty && (
                  <p className="mt-1 text-xs text-muted-foreground">Higher = more violence against women → larger penalty.</p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-magenta transition-smooth">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to baseline
            </button>
            <button onClick={kanyashree} className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:border-magenta transition-smooth">
              Kanyashree scenario (Education 67→76)
            </button>
          </div>
        </div>

        {/* Score panel */}
        <aside className="rounded-lg border border-border bg-card p-6 lg:sticky lg:top-24">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">SHE Score (v2)</div>
          <div className="mt-1 font-serif text-6xl font-bold tnum">{score.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">/ 100</div>
          <div className={`mt-3 text-sm font-medium tnum ${delta > 0 ? "text-pillar-economic" : delta < 0 ? "text-magenta-ink" : "text-muted-foreground"}`}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)} vs. baseline ({baseScore.toFixed(1)})
          </div>

          {crisis && (
            <div className="mt-5 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <div className="flex items-center gap-1.5 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Crisis flag
              </div>
              <p className="mt-1 text-foreground/80">
                Crime index rose &gt;15% above baseline — emergency review protocol.
              </p>
            </div>
          )}

          <p className="mt-5 text-xs text-muted-foreground border-t border-border pt-4">
            Illustrative only. The published score uses the same formula on independent institutional data —
            see the <a href="/methodology" className="text-magenta-ink hover:underline">methodology</a>.
          </p>
        </aside>
      </div>
    </Layout>
  );
}
