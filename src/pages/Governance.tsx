import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";

export default function Governance() {
  const meta = pageByKey("Governance")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/governance`} />
      <PageHero
        eyebrow="Governance"
        title="How the SHE Score is governed"
        lead="The methodology is public and the process for changing it is fixed in advance — so no score can move without a documented, reviewable reason."
      />
      <div className="container max-w-3xl py-12 space-y-10">
        <section>
          <h2>The data standard</h2>
          <p className="mt-3 text-foreground/80">
            An indicator may affect the published score only when its source is <strong>independent and institutional</strong>,
            covers <strong>≥80% of scored countries</strong>, and was <strong>published within two years</strong>.
            Candidate indicators that do not meet all three are shadow-scored in public and excluded from published scores.
          </p>
        </section>
        <section>
          <h2>The 30-day public challenge window</h2>
          <p className="mt-3 text-foreground/80">When scores publish each cycle, a 30-day window opens:</p>
          <ol className="mt-3 space-y-2 text-foreground/80 list-decimal pl-5">
            <li>Anyone may file a score challenge or propose a data source in the public repository.</li>
            <li>Each submission is triaged in the open, with an accept / decline / needs-more rationale on the thread.</li>
            <li>Accepted challenges that change a score are applied in a documented revision, with the input and config diff linked.</li>
            <li>After the window closes, scores are final for the cycle; open items roll into the next window.</li>
          </ol>
          <p className="source-line not-italic mt-3 text-muted-foreground">
            File a challenge in the <a href={`${SITE.repo}/blob/main/CONTRIBUTING.md`} className="text-magenta-ink hover:underline" target="_blank" rel="noreferrer">research repository</a>.
          </p>
        </section>
        <section>
          <h2>Methodology-change rules</h2>
          <ul className="mt-3 space-y-2 text-foreground/80 list-disc pl-5">
            <li>Pillar weights and the formula are frozen within a published version; changes require a new version.</li>
            <li>A candidate pillar is activated only when it independently meets the data standard, one at a time.</li>
            <li>Every change ships with a public diff to the configuration and a note in the methodology.</li>
          </ul>
        </section>
        <section>
          <h2>Advisory council</h2>
          <p className="mt-3 text-foreground/80">
            An independent advisory council reviews methodology changes and adjudicates disputed challenges. Council
            composition and conflict-of-interest rules are published here as members are appointed.
          </p>
        </section>
        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          See the full method on the <Link to="/methodology" className="text-magenta-ink hover:underline">methodology page</Link>.
        </p>
      </div>
    </Layout>
  );
}
