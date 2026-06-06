/* Single source of truth for shescore.org's pages.
   Consumed by: the router (App.tsx), the sitemap generator, and the prerenderer.
   Keeping routes + per-page meta here guarantees the three never drift. */

export interface PageMeta {
  path: string;
  /** Page component key (App maps this to the lazy import). */
  key: string;
  title: string;
  description: string;
  /** Sitemap hints. */
  priority: string;
  changefreq: string;
  /** Exclude from sitemap + robots (e.g. /admin). */
  noindex?: boolean;
  /** Show in the primary nav (in array order). */
  nav?: boolean;
  /** Short nav label (defaults to title). */
  navLabel?: string;
}

export const SITE = {
  name: "SHE Score",
  publisher: "The SHE Score Foundation",
  origin: "https://www.shescore.org",
  repo: "https://github.com/theshescorefoundation/shescore",
  tokenLine: "An independent token project also tracks the SHE Score → shetoken.org",
};

export const PAGES: PageMeta[] = [
  {
    path: "/", key: "Home", nav: false,
    title: "SHE Score — Open Data on Women's Empowerment in 105 Countries",
    description:
      "The SHE Score is an open-source, auditable 0–100 measure of women's empowerment in 105 countries, built from UN Women, World Bank, WHO and UNODC data. Published annually with a 30-day public challenge window.",
    priority: "1.0", changefreq: "weekly",
  },
  {
    path: "/scores", key: "Scores", nav: true, navLabel: "Scores",
    title: "SHE Score Rankings — 105 Countries | SHE Score",
    description:
      "The v2 SHE Score leaderboard for 105 countries and Indian states, with per-country profiles and reference comparisons to other gender indices. Open, auditable, annually published.",
    priority: "0.9", changefreq: "weekly",
  },
  {
    path: "/methodology", key: "Methodology", nav: true, navLabel: "Methodology",
    title: "Methodology — How the SHE Score Is Built | SHE Score",
    description:
      "The full v2 methodology: five LIVE pillars, indicator weights, normalisation, the formula, the West Bengal worked example, data-quality standards, the annual cycle, and the audit & 30-day challenge process.",
    priority: "0.9", changefreq: "monthly",
  },
  {
    path: "/lab", key: "Lab", nav: true, navLabel: "The Lab",
    title: "The Methodology Lab — v3 Shadow Scores in Validation | SHE Score",
    description:
      "Where the next version of the SHE Score is validated in public. v3 candidate pillars are shadow-scored openly until they meet the published data standard. Shadow scores do not yet affect published scores.",
    priority: "0.7", changefreq: "weekly",
  },
  {
    path: "/landscape", key: "Landscape", nav: true, navLabel: "Landscape",
    title: "The Index Landscape — SHE Score vs. the World's Gender Indices | SHE Score",
    description:
      "How the SHE Score relates to the world's leading gender indices — UNDP/UN Women WEI, WEF Global Gender Gap, Georgetown WPS, EIGE, OECD SIGI, IFPRI WEAI, World Bank WBL. Differentiators: update cadence, sub-national resolution, open auditability.",
    priority: "0.7", changefreq: "monthly",
  },
  {
    path: "/explorer", key: "Explorer", nav: true, navLabel: "Explorer",
    title: "Score Explorer — See How the SHE Score Responds | SHE Score",
    description:
      "An illustrative explorer: adjust the five LIVE pillars and watch the v2 SHE Score recompute live from the West Bengal baseline (39.1), including the Kanyashree education scenario (+1.8).",
    priority: "0.6", changefreq: "monthly",
  },
  {
    path: "/community", key: "Community", nav: true, navLabel: "Initiatives",
    title: "The Initiative Repository — Programs That Move the Score | SHE Score",
    description:
      "A curated, verified repository of organizations advancing women's empowerment — filterable by pillar and region. Listing is not endorsement; contact details are verified quarterly.",
    priority: "0.6", changefreq: "monthly",
  },
  {
    path: "/reports", key: "Reports", nav: true, navLabel: "Reports",
    title: "Reports Library — Gender Index Research | SHE Score",
    description:
      "A curated library of gender-index research from the WEF, UNDP/UN Women, Georgetown, EIGE, OECD, IFPRI and the World Bank — each with a summary, key findings, and a link to the official source.",
    priority: "0.6", changefreq: "monthly",
  },
  {
    path: "/data", key: "Data", nav: true, navLabel: "Data",
    title: "Data & Downloads — Scores, Inputs, API | SHE Score",
    description:
      "Download the SHE Score dataset (CSV/JSON), input snapshots and recompute documentation, browse the public research repository, and read the v2 API reference. Everything open and auditable.",
    priority: "0.7", changefreq: "monthly",
  },
  {
    path: "/governance", key: "Governance", nav: false,
    title: "Governance — Advisory Council, Challenge Process & Data Standard | SHE Score",
    description:
      "How the SHE Score is governed: the advisory council, the methodology-change rules, the published data standard, and the 30-day public challenge process.",
    priority: "0.5", changefreq: "yearly",
  },
  {
    path: "/register", key: "Register", nav: false,
    title: "Data Verification Program for Governments & NGOs | SHE Score",
    description:
      "Governments and NGOs can register for the data-verification program: a verified profile (Blue Tick) and quarterly score updates from verified data. Express interest via the form.",
    priority: "0.5", changefreq: "yearly",
  },
  {
    path: "/about", key: "About", nav: false,
    title: "About — The SHE Score Foundation | SHE Score",
    description:
      "The SHE Score Foundation publishes the SHE Score: an independent, open-source measure of women's empowerment. Our mission, our standards, and how to reach us.",
    priority: "0.5", changefreq: "yearly",
  },
  {
    path: "/privacy", key: "Privacy", nav: false,
    title: "Privacy Policy | SHE Score",
    description:
      "What shescore.org collects across its forms, why, how long we keep it, how to be removed, and our no-sale-of-data commitment.",
    priority: "0.3", changefreq: "yearly",
  },
];

/** Pages shown in the primary navigation, in order. */
export const NAV_PAGES = PAGES.filter((p) => p.nav);

/** Lookup by component key. */
export const pageByKey = (key: string) => PAGES.find((p) => p.key === key);
