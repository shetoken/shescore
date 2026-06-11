import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { ExternalLink, ArrowRight, FileText, Sparkles } from "lucide-react";

type Topic = "Composite index" | "Safety & violence" | "Economic & legal" | "Health" | "Cross-cutting";

interface Report {
  title: string;
  publisher: string;
  edition: string;   // human label
  date: string;      // sortable YYYY-MM
  coverage: string;
  topic: Topic;
  summary: string;
  findings: string[];
  url: string;
}

/* Curated library of the major published gender-index research. Summaries are our
   own; each links to the publisher's official page (which always serves the latest
   edition). Referenced for context only — never inputs to the SHE Score. */
const REPORTS: Report[] = [
  {
    title: "Global Gender Gap Report",
    publisher: "World Economic Forum",
    edition: "2024 edition", date: "2024-06", coverage: "146 countries", topic: "Composite index",
    summary: "The longest-running benchmark of gender parity, scoring the gap between women and men across economic participation, educational attainment, health & survival, and political empowerment.",
    findings: ["Overall parity is ~68.5% closed; on the current trajectory full parity is more than a century away.", "Health and education gaps are nearly closed; economic and political gaps remain the widest."],
    url: "https://www.weforum.org/publications/global-gender-gap-report-2024/",
  },
  {
    title: "Women, Business and the Law",
    publisher: "World Bank",
    edition: "2024 edition", date: "2024-03", coverage: "190 economies", topic: "Economic & legal",
    summary: "Measures the laws and regulations that affect women's economic opportunity across a working life — from mobility and pay to entrepreneurship, marriage and pensions.",
    findings: ["When safety from violence and access to childcare are added, women enjoy barely two-thirds of the legal rights of men.", "No country grants women full legal parity once these dimensions are counted."],
    url: "https://wbl.worldbank.org/",
  },
  {
    title: "Women, Peace and Security Index",
    publisher: "Georgetown Institute (GIWPS) & PRIO",
    edition: "2023/24 edition", date: "2023-10", coverage: "177 countries", topic: "Safety & violence",
    summary: "Ranks countries on women's inclusion, justice, and security — combining economic and political inclusion, legal protection, and freedom from violence in the home and community.",
    findings: ["The gap between the best- and worst-performing countries is vast and widening in conflict-affected states.", "Organised violence and intimate-partner violence remain the sharpest threats to women's security."],
    url: "https://giwps.georgetown.edu/the-index/",
  },
  {
    title: "Social Institutions & Gender Index (SIGI)",
    publisher: "OECD Development Centre",
    edition: "2023 edition", date: "2023-03", coverage: "179 countries", topic: "Composite index",
    summary: "Looks beneath outcomes to the discriminatory social institutions — laws, norms and practices — that drive gender inequality, across family, physical integrity, economic and civil rights.",
    findings: ["Discriminatory norms cost the global economy trillions of dollars a year.", "Legal reform often outpaces change in attitudes, leaving 'on-paper' rights unrealised."],
    url: "https://www.oecd.org/en/topics/sub-issues/social-institutions-and-gender.html",
  },
  {
    title: "Women's Empowerment Index & Global Gender Parity Index",
    publisher: "UNDP & UN Women",
    edition: "2023 (inaugural)", date: "2023-07", coverage: "114 countries", topic: "Composite index",
    summary: "The first joint UN measure to track women's empowerment (their own capabilities and freedoms) separately from the parity gap between women and men, across health, education, inclusion and decision-making.",
    findings: ["No country has achieved full women's empowerment or full gender parity.", "Most women live in countries scoring in the middle band on both measures — neither parity nor disempowerment."],
    url: "https://www.unwomen.org/en/digital-library/publications/2023/07/the-paths-to-equal",
  },
  {
    title: "Gender Equality Index",
    publisher: "European Institute for Gender Equality (EIGE)",
    edition: "2024 edition", date: "2024-10", coverage: "EU-27", topic: "Composite index",
    summary: "The EU's flagship index, scoring member states 1–100 across work, money, knowledge, time, power and health — with satellite domains on violence and intersecting inequalities.",
    findings: ["Progress is real but slow; the 'power' domain (decision-making) drives most of the recent gains.", "The unequal division of unpaid care work remains a persistent brake on parity."],
    url: "https://eige.europa.eu/gender-equality-index",
  },
  {
    title: "Violence Against Women — Prevalence Estimates",
    publisher: "World Health Organization",
    edition: "Latest estimates", date: "2021-03", coverage: "Global / regional", topic: "Safety & violence",
    summary: "The definitive global estimate of physical and/or sexual intimate-partner and non-partner violence against women, pooled across hundreds of national studies.",
    findings: ["About 1 in 3 women worldwide experience physical or sexual violence in their lifetime.", "Violence often begins early — for many survivors, before the age of 25."],
    url: "https://www.who.int/news-room/fact-sheets/detail/violence-against-women",
  },
  {
    title: "Child Marriage — Latest Trends and Data",
    publisher: "UNICEF",
    edition: "Latest update", date: "2023-05", coverage: "Global", topic: "Health",
    summary: "UNICEF's running estimate of child marriage and its drivers, tracking progress (and stalls) toward ending the practice by 2030.",
    findings: ["Roughly 1 in 5 young women were married before their 18th birthday.", "Progress has slowed; crises and conflict push families back toward early marriage."],
    url: "https://data.unicef.org/topic/child-protection/child-marriage/",
  },
  {
    title: "Progress on the Sustainable Development Goals — Gender Snapshot",
    publisher: "UN Women & UN DESA",
    edition: "Annual", date: "2024-09", coverage: "Global (SDG 5)", topic: "Cross-cutting",
    summary: "The annual scorecard on SDG 5 (gender equality) and gender dimensions across all 17 goals, flagging where the world is on or off track for 2030.",
    findings: ["At the current pace, several gender targets will be missed by generations, not years.", "Data gaps remain a barrier — many gender indicators still lack recent, comparable figures."],
    url: "https://www.unwomen.org/en/digital-library/publications",
  },
  {
    title: "Women's Empowerment in Agriculture Index (WEAI)",
    publisher: "IFPRI, USAID & OPHI",
    edition: "Survey-based", date: "2022-01", coverage: "Survey countries", topic: "Economic & legal",
    summary: "A survey-based index measuring women's empowerment, agency and inclusion in the agricultural sector relative to the men in their households.",
    findings: ["Control over income and group membership are the dimensions women most often lack.", "Empowering women farmers raises household productivity and child nutrition."],
    url: "https://www.ifpri.org/project/weai",
  },
];

const TOPICS: ("All" | Topic)[] = ["All", "Composite index", "Safety & violence", "Economic & legal", "Health", "Cross-cutting"];

export default function Reports() {
  const meta = pageByKey("Reports")!;
  const [topic, setTopic] = useState<"All" | Topic>("All");

  const sorted = useMemo(() => [...REPORTS].sort((a, b) => b.date.localeCompare(a.date)), []);
  const latest = sorted[0];
  const filtered = useMemo(() => (topic === "All" ? sorted : sorted.filter((r) => r.topic === topic)), [sorted, topic]);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d: string) => { const [y, m] = d.split("-"); return `${MONTHS[Number(m) - 1]} ${y}`; };

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/reports`} />
      <PageHero
        eyebrow="Reports library"
        title="The research behind the gender indices"
        lead="A curated, regularly-updated library of the world's leading gender-index research — each with a plain-English summary, key findings, and a link to the publisher's official report."
      />

      <div className="container max-w-5xl py-10 space-y-8">
        {/* Latest published — featured */}
        <section className="rounded-xl border border-magenta/40 bg-magenta/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-magenta-ink mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Latest published · {fmtDate(latest.date)}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="!text-2xl !mb-1">{latest.title}</h2>
              <div className="text-sm text-muted-foreground">{latest.publisher} · {latest.edition} · {latest.coverage}</div>
              <p className="mt-3 text-sm text-foreground/80">{latest.summary}</p>
            </div>
            <a href={latest.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth shrink-0">
              Read the report <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Topic filter */}
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} onClick={() => setTopic(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth ${topic === t ? "border-magenta bg-magenta/15 text-magenta-ink" : "border-border text-muted-foreground hover:border-magenta/50"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Library grid */}
        <section className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <article key={r.title} className="rounded-lg border border-border bg-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><FileText className="h-3.5 w-3.5 text-magenta-ink" /> {r.topic}</div>
                <span className="text-[11px] text-muted-foreground">{fmtDate(r.date)}</span>
              </div>
              <h3 className="mt-1.5 font-serif text-lg font-semibold leading-tight">{r.title}</h3>
              <div className="text-xs text-muted-foreground mt-0.5">{r.publisher} · {r.coverage}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-snug">{r.summary}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-foreground/80">
                {r.findings.map((f) => <li key={f} className="flex gap-1.5"><span className="text-magenta-ink shrink-0">›</span>{f}</li>)}
              </ul>
              <a href={r.url} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-magenta-ink hover:underline">
                Read the report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </section>

        {/* Cross-link */}
        <section className="rounded-lg border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="font-semibold mb-1">How these compare to the SHE Score</h3>
            <p className="text-sm text-muted-foreground">See cadence, coverage and sub-national resolution side by side on the index landscape.</p>
          </div>
          <Link to="/landscape" className="inline-flex items-center gap-1.5 text-sm text-magenta-ink hover:underline shrink-0">The index landscape <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>

        <p className="source-line">
          Referenced for context only and never inputs to the SHE Score. Summaries are our own; figures are the publishers'. Links go to each publisher's official report. Published by {SITE.publisher}.
        </p>
      </div>
    </Layout>
  );
}
