import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";

export default function About() {
  const meta = pageByKey("About")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/about`} />
      <PageHero
        eyebrow="About"
        title="The SHE Score Foundation"
        lead="We publish the SHE Score: an independent, open-source measure of women's empowerment, built so the number can be trusted, reproduced, and challenged."
      />
      <div className="container max-w-3xl py-12 space-y-10">
        <section>
          <h2>Our mission</h2>
          <p className="mt-3 text-foreground/80">
            Most gender data lives in reports that are published occasionally and read by few. The SHE Score makes that
            same institutional data continuous, comparable, sub-national, and fully auditable — so progress and regression
            are visible, and the methodology is open to public scrutiny.
          </p>
        </section>
        <section>
          <h2>What we publish</h2>
          <ul className="mt-3 space-y-2 text-foreground/80 list-disc pl-5">
            <li>The SHE Score for 105 countries and Indian states, annually (quarterly for registered governments).</li>
            <li>The full methodology, configuration and input data — openly, in a public repository.</li>
            <li>A 30-day public challenge window each cycle, where any score or method can be disputed.</li>
          </ul>
        </section>
        <section>
          <h2>Independence</h2>
          <p className="mt-3 text-foreground/80">
            The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the UNDP/UN
            Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.
            "The SHE Score Foundation" is the publisher's name; we make no claim of nonprofit, charitable, or
            tax-exempt status.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p className="mt-3 text-foreground/80">
            General enquiries and data corrections: <a href="mailto:contact@shescore.org" className="text-magenta-ink hover:underline">contact@shescore.org</a>.
            To register a government or NGO data programme, see <Link to="/register" className="text-magenta-ink hover:underline">Register</Link>.
          </p>
        </section>
      </div>
    </Layout>
  );
}
