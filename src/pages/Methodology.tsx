import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { PILLARS } from "@/theme/pillars";
import { PillarDot } from "@/components/design/Badges";

const PILLAR_INDICATORS: Record<string, string> = {
  empowerment: "Parliamentary seats, ministerial roles, legal rights, freedom of movement",
  education: "Literacy, secondary enrollment, STEM participation, completion rates",
  economic: "Gender pay gap, formal employment, banking access, property rights",
  health: "Maternal mortality, life expectancy, anaemia, adolescent birth rate",
  safety: "Rape rate, femicide, domestic violence, trafficking — subtracted",
};

const V3 = [
  ["Bodily Autonomy", "Period poverty, child marriage, FGM, reproductive rights", "No institutional 105-country dataset for period poverty"],
  ["Dignity & Welfare", "Widow rights, caregiver burden, food insecurity, mental health", "No ≥80%-coverage dataset for unpaid-care burden"],
  ["Digital & Social", "Online harassment, internet & mobile gender gaps", "Online-harassment prevalence lacks comparable cross-country data"],
  ["Safety & Justice (expanded)", "Police responsiveness, legal aid access, honour-based violence", "No ≥80%-coverage dataset for police responsiveness to GBV"],
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="scroll-mt-24 mt-12 first:mt-0">{children}</h2>;
}

export default function Methodology() {
  const meta = pageByKey("Methodology")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/methodology`} />
      <PageHero
        eyebrow="Methodology · v2"
        title="How the SHE Score is built"
        lead="Every pillar, weight, normalisation rule and data source is public. The published score can be reproduced from public data and public code."
      />

      <div className="container max-w-3xl py-12">
        {/* On-page nav */}
        <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground border-b border-border pb-5">
          {[["formula", "Formula"], ["pillars", "Pillars"], ["normalisation", "Normalisation"], ["example", "Worked example"], ["standard", "Data standard"], ["v3", "v3 pillars"], ["sources", "Sources"], ["challenge", "Audit & challenge"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hover:text-magenta-ink">{label}</a>
          ))}
        </nav>

        <p className="text-foreground/80">
          The SHE Score is a 0–100 measure of how good life is for women in a country — where higher always means better.
          It is built from independent institutional data (UN Women, World Bank, WHO, UNODC, UNESCO and ILO) and published
          annually, and quarterly for registered governments. The published score (<strong>v2</strong>) is computed from
          five LIVE pillars.
        </p>

        <H id="formula">The formula</H>
        <pre className="mt-3 overflow-x-auto text-sm bg-card rounded-md p-4 border border-border">
{`SHE Score (v2) = (Empowerment × 0.25)
               + (Education & Literacy × 0.20)
               + (Economic Inclusion × 0.20)
               + (Health & Survival × 0.15)
               − (Safety / Crime Penalty × 0.20)`}
        </pre>
        <p className="source-line not-italic mt-3 text-muted-foreground">
          Each pillar is a 0–100 sub-score. The crime penalty is subtracted, never added. The result is rounded to one
          decimal place, half-up.
        </p>

        <H id="pillars">The five LIVE pillars</H>
        <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="text-left font-medium px-4 py-3">Pillar</th><th className="text-left font-medium px-4 py-3 w-20">Weight</th><th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Indicators</th></tr>
            </thead>
            <tbody>
              {PILLARS.map((p) => (
                <tr key={p.key} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium"><PillarDot pillarKey={p.key} className="mr-2" />{p.label}</td>
                  <td className="px-4 py-3 tnum" style={{ color: p.hex }}>{p.weightLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{PILLAR_INDICATORS[p.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H id="normalisation">Normalisation</H>
        <p className="mt-3 text-foreground/80">
          Each raw indicator is normalised to a 0–100 sub-score against documented bounds. Indicators where <em>higher is
          worse</em> — maternal mortality, adolescent birth rate, gender pay gap, rape rate, domestic-violence rate,
          femicide rate, trafficking rate — are inverted, so that for every sub-score higher always means better. Pillar
          sub-scores are the weighted mean of their indicators; the SHE Score is the weighted sum of the pillars.
        </p>

        <H id="example">Worked example — West Bengal</H>
        <p className="mt-3 text-foreground/80">Inputs: Empowerment 52, Education 67, Economic 52, Health 71, Crime penalty 42.</p>
        <pre className="mt-3 overflow-x-auto text-sm bg-card rounded-md p-4 border border-border">
{`(52 × 0.25) + (67 × 0.20) + (52 × 0.20) + (71 × 0.15) − (42 × 0.20)
= 13.00 + 13.40 + 10.40 + 10.65 − 8.40
= 39.05  →  39.1   (rounded half-up)`}
        </pre>
        <p className="source-line not-italic mt-3 text-muted-foreground">
          This value is regression-locked: the published configuration must reproduce 39.1 from these inputs.
        </p>

        <H id="standard">The data standard</H>
        <p className="mt-3 text-foreground/80">
          A pillar may affect the published score only when its source is independent and institutional, covers
          <strong> ≥80% of scored countries</strong>, and was <strong>published within two years</strong>. Pillars that do
          not yet meet the bar are shadow-scored in public and excluded from published scores.
        </p>

        <H id="v3">v3 — pillars in validation</H>
        <p className="mt-3 text-foreground/80">
          Four candidate pillars are tracked openly in <Link to="/lab" className="text-magenta-ink hover:underline">The Lab</Link> until
          they meet the data standard. They do not yet affect published scores.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="text-left font-medium px-4 py-3">Candidate pillar</th><th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Candidate indicators</th><th className="text-left font-medium px-4 py-3">Blocking gap</th></tr>
            </thead>
            <tbody>
              {V3.map(([name, ind, gap]) => (
                <tr key={name} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium">{name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{ind}</td>
                  <td className="px-4 py-3 text-muted-foreground">{gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H id="sources">Data sources</H>
        <p className="mt-3 text-foreground/80">
          UN Women · World Bank Gender Data Portal &amp; Women, Business and the Law · World Health Organization ·
          UN Office on Drugs and Crime · UNESCO · International Labour Organization · OECD (SIGI). No third-party composite
          index is ever an input to the SHE Score.
        </p>

        <H id="challenge">Audit &amp; challenge</H>
        <p className="mt-3 text-foreground/80">
          The methodology, configuration and inputs are public in the research repository. Scores are published annually,
          and quarterly for registered governments. When scores publish, a <strong>30-day public challenge window</strong> opens —
          anyone can dispute a score or propose a data source.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={SITE.repo} className="inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth" target="_blank" rel="noreferrer">
            The research repository
          </a>
          <Link to="/governance" className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:border-magenta transition-smooth">
            Governance &amp; challenge process
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground border-t border-border pt-6">
          The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the UNDP/UN
          Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.
        </p>
      </div>
    </Layout>
  );
}
