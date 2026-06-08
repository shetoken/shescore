import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { Clock, MapPin, BookOpenCheck } from "lucide-react";

const INDICES = [
  ["WEF Global Gender Gap Index", "World Economic Forum", "146 countries", "Annual", "No"],
  ["Women's Empowerment Index (WEI/GGPI)", "UNDP / UN Women", "114 countries", "Periodic", "No"],
  ["Women, Peace & Security Index", "Georgetown (GIWPS)", "177 countries", "Biennial", "No"],
  ["Gender Equality Index", "EIGE", "EU-27", "Annual", "No"],
  ["Social Institutions & Gender Index (SIGI)", "OECD", "179 countries", "~4 years", "No"],
  ["Women's Empowerment in Agriculture (WEAI)", "IFPRI", "Survey-based", "Periodic", "Survey"],
  ["Women, Business and the Law (WBL)", "World Bank", "190 economies", "Annual", "No"],
  ["SHE Score", SITE.publisher, "105 countries", "Annual · quarterly for registered govts", "Yes (states)"],
];

export default function Landscape() {
  const meta = pageByKey("Landscape")!;
  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/landscape`} />
      <PageHero
        eyebrow="The landscape"
        title="The SHE Score among the world's gender indices"
        lead="We use the same institutional data the major indices use. What differs is the cadence, the resolution, and how openly the method can be audited."
      />

      <div className="container max-w-4xl py-12 space-y-12">
        <section>
          <h2>At a glance</h2>
          <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Index</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Publisher</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Coverage</th>
                    <th className="text-left font-medium px-4 py-3">Update cadence</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Sub-national</th>
                  </tr>
                </thead>
                <tbody>
                  {INDICES.map((r) => {
                    const isShe = r[0] === "SHE Score";
                    return (
                      <tr key={r[0]} className={`border-b border-border/40 last:border-0 ${isShe ? "bg-magenta/10" : ""}`}>
                        <td className={`px-4 py-3 font-medium ${isShe ? "text-magenta-ink" : ""}`}>{r[0]}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r[1]}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r[2]}</td>
                        <td className="px-4 py-3">{r[3]}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r[4]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="source-line">Coverage and cadence per each publisher's latest release.</p>
        </section>

        <section>
          <h2>Where the SHE Score differs</h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: "Update cadence", body: "Annual, and quarterly for registered governments — not occasional reports." },
              { icon: MapPin, title: "Sub-national resolution", body: "Scored below the country level (Indian states today) so individual programmes are visible." },
              { icon: BookOpenCheck, title: "Open auditability", body: "Full method, config and inputs are public, with a 30-day window to challenge any score." },
            ].map((c) => (
              <div key={c.title} className="rounded-lg border border-border bg-card p-5">
                <c.icon className="h-5 w-5 text-magenta-ink" />
                <div className="mt-2 font-serif font-semibold">{c.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground border-t border-border pt-6">
          The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the indices
          listed above. Third-party scores are referenced for context only and are never inputs to the SHE Score.{" "}
          <Link to="/methodology" className="text-magenta-ink hover:underline">Read the methodology →</Link>
        </p>
      </div>
    </Layout>
  );
}
