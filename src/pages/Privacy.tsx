import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";

export default function Privacy() {
  const meta = pageByKey("Privacy")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/privacy`} />
      <PageHero eyebrow="Privacy" title="Privacy policy" lead="What shescore.org collects, why, and how to be removed." />
      <div className="container max-w-3xl py-12 space-y-8 text-foreground/80">
        <section>
          <h2>What we collect</h2>
          <p className="mt-3">
            When you submit a form on this site (for example, the government/NGO data-verification interest form), we
            collect the organisation name, organisation type, country, a contact email, and any message you include. We
            also record anonymous usage analytics (page views and an approximate country/city derived from your IP).
          </p>
        </section>
        <section>
          <h2>Why we use it</h2>
          <p className="mt-3">
            To respond to your enquiry, operate the data-verification programme, and understand demand for the SHE Score.
            We contact you only about what you submitted. We do not send marketing without your explicit consent, and
            consent checkboxes are unchecked by default.
          </p>
        </section>
        <section>
          <h2>What we don't do</h2>
          <p className="mt-3">We never sell, rent or trade your personal data. We keep submissions only as long as needed to act on them.</p>
        </section>
        <section>
          <h2>Access &amp; removal</h2>
          <p className="mt-3">
            To access or delete your data, email{" "}
            <a href="mailto:contact@shescore.org" className="text-magenta-ink hover:underline">contact@shescore.org</a>.
          </p>
        </section>
      </div>
    </Layout>
  );
}
