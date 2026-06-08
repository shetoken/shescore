import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { Download, ExternalLink } from "lucide-react";

const FILES = [
  { name: "scores-2025.json", desc: "Computed v2 scores, all countries", path: "/blob/main/data/scores-2025.json" },
  { name: "inputs-2025.csv", desc: "Per-country pillar inputs (the published snapshot)", path: "/blob/main/data/inputs-2025.csv" },
  { name: "config/v2.json", desc: "Official frozen configuration (weights, normalisation)", path: "/blob/main/config/v2.json" },
  { name: "config/v3.json", desc: "Shadow v3 configuration (in validation)", path: "/blob/main/config/v3.json" },
  { name: "sources.md", desc: "Data sources and the data standard", path: "/blob/main/data/sources.md" },
];

const ENDPOINTS = [
  ["GET /api/v2/scores", "Official v2 scores for all countries"],
  ["GET /api/v2/scores/{iso}", "One country, v2"],
  ["GET /api/v3-preview/scores", "Shadow v3 scores (in validation) — never a published score"],
  ["GET /v1/wei/countries", "Country list with pillar sub-scores"],
  ["GET /v1/wei/countries/{iso}", "Single country detail"],
];

export default function Data() {
  const meta = pageByKey("Data")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/data`} />
      <PageHero
        eyebrow="Data &amp; API"
        title="Download, reproduce, audit"
        lead="Everything needed to reproduce and audit the SHE Score is open — the scores, the inputs, the configuration, and the code."
      />

      <div className="container max-w-3xl py-12 space-y-12">
        <section>
          <h2>Datasets</h2>
          <div className="mt-4 rounded-lg border border-border bg-card divide-y divide-border">
            {FILES.map((f) => (
              <a key={f.name} href={`${SITE.repo}${f.path}`} target="_blank" rel="noreferrer"
                 className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent/40 transition-smooth">
                <div>
                  <div className="font-mono text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
          <p className="source-line">All files live in the public research repository.</p>
        </section>

        <section>
          <h2>Reproduce the scores</h2>
          <p className="mt-3 text-foreground/80">Any published score can be recomputed from the inputs and a config:</p>
          <pre className="mt-3 overflow-x-auto text-sm bg-card rounded-md p-4 border border-border">
{`python code/recompute.py --config config/v2.json --inputs data/inputs-2025.csv`}
          </pre>
        </section>

        <section>
          <h2>API reference</h2>
          <p className="mt-3 text-foreground/80">
            A read-only JSON API over HTTPS. Base URL: <code className="text-sm">https://api.shescore.org</code>.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-card divide-y divide-border">
            {ENDPOINTS.map(([ep, desc]) => (
              <div key={ep} className="px-4 py-3">
                <div className="font-mono text-sm">{ep}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
          <p className="source-line">
            Comparison indexes shown elsewhere on the site are for reference only and are never inputs to the SHE Score.
          </p>
        </section>

        <a href={SITE.repo} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth">
          Open the research repository <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Layout>
  );
}
