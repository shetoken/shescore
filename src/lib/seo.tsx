import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const BASE_URL = "https://www.shescore.org";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "SHE Score";
const PUBLISHER = "The SHE Score Foundation";
const REPO = "https://github.com/theshescorefoundation/shescore";

export function SEO({
  title = "SHE Score — Open Data on Women's Empowerment in 105 Countries",
  description = "The SHE Score is an open-source, auditable 0–100 measure of women's empowerment in 105 countries, built from UN Women, World Bank, WHO and UNODC data.",
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = "website",
}: SEOProps) {
  const fullTitle = title.includes("SHE Score") ? title : `${title} | SHE Score`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD — Foundation (publisher) + the SHE Score as a citable Dataset */}
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": PUBLISHER,
            "url": BASE_URL,
            "description": "Publisher of the SHE Score, an open-source measure of women's empowerment.",
            "sameAs": [REPO],
          },
          {
            "@type": "Dataset",
            "name": "SHE Score",
            "description":
              "An open-source, auditable 0–100 measure of women's empowerment scoring 105 countries. The published score (v2) uses five LIVE weighted pillars — empowerment, education & literacy, economic inclusion, health & survival, and a safety (crime) penalty; four further pillars are in validation. Built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data.",
            "url": `${BASE_URL}/scores`,
            "keywords": ["women's empowerment", "gender equality index", "SHE Score", "gender data", "femicide", "maternal mortality"],
            "creator": { "@type": "Organization", "name": PUBLISHER },
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "isAccessibleForFree": true,
            "distribution": [{
              "@type": "DataDownload",
              "encodingFormat": "application/json",
              "contentUrl": "https://api.shescore.org/v1/wei/countries",
            }],
          },
        ],
      })}</script>
    </Helmet>
  );
}

export function CountrySEO({ country, iso, score, region }: {
  country: string; iso: string; score: number; region: string;
}) {
  const url = `${BASE_URL}/scores/${iso}`;
  const title = `${country} SHE Score — ${score}/100 | SHE Score`;
  const description = `${country}'s SHE Score is ${score}/100. Explore the five LIVE pillar scores and how ${country} compares across 105 countries. Published by ${PUBLISHER}.`;
  return (
    <>
      <SEO title={title} description={description} url={url} type="article" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Dataset",
              "name": `${country} — SHE Score`,
              "description": `${country} (${region}) scores ${score}/100 on the SHE Score.`,
              "url": url,
              "variableMeasured": "SHE Score, 0–100",
              "creator": { "@type": "Organization", "name": PUBLISHER },
              "isAccessibleForFree": true,
              "distribution": [{
                "@type": "DataDownload",
                "encodingFormat": "application/json",
                "contentUrl": `https://api.shescore.org/v1/wei/countries/${iso}`,
              }],
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Scores", "item": `${BASE_URL}/scores` },
                { "@type": "ListItem", "position": 2, "name": country, "item": url },
              ],
            },
          ],
        })}</script>
      </Helmet>
    </>
  );
}
