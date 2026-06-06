/**
 * Generates public/sitemap.xml + public/robots.txt for shescore.org from the
 * page manifest plus the live country list (for /scores/{iso} profiles).
 * Runs at prebuild. Never fails the build — falls back to manifest-only.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.shescore.org";
const API = "https://api.shetoken.org/v1/wei/countries?limit=105&sort=wei_score&order=desc";
const today = new Date().toISOString().slice(0, 10);

/* Read the manifest's public (indexable) routes. The manifest is TS, so we parse
   the path/priority/changefreq/noindex fields out of it without importing TS. */
function readManifestRoutes() {
  try {
    const src = readFileSync(resolve(ROOT, "src/config/manifest.ts"), "utf8");
    const routes = [];
    const re = /path:\s*"([^"]+)"[\s\S]*?priority:\s*"([^"]+)",\s*changefreq:\s*"([^"]+)"(\s*,\s*noindex:\s*(true))?/g;
    let m;
    while ((m = re.exec(src))) {
      routes.push({ loc: m[1], priority: m[2], freq: m[3], noindex: m[5] === "true" });
    }
    return routes;
  } catch (e) {
    console.warn(`[sitemap] manifest parse failed (${e})`);
    return [{ loc: "/", priority: "1.0", freq: "weekly", noindex: false }];
  }
}

const urlXml = ({ loc, priority, freq }) =>
  `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

async function main() {
  const manifest = readManifestRoutes();
  const indexable = manifest.filter((r) => !r.noindex);

  let countries = [];
  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(15000) });
    const json = await res.json();
    countries = (json.data ?? json ?? []).map((c) => c.iso_code).filter(Boolean);
  } catch (e) {
    console.warn(`[sitemap] country fetch failed (${e}); manifest routes only`);
  }

  const entries = [
    ...indexable,
    ...countries.map((iso) => ({ loc: `/scores/${iso}`, priority: "0.7", freq: "weekly" })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(urlXml).join("\n") +
    `\n</urlset>\n`;
  writeFileSync(resolve(ROOT, "public", "sitemap.xml"), xml, "utf8");

  // robots.txt — allow all indexable routes; explicitly disallow /admin.
  const robots =
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /admin\n` +
    `Disallow: /admin/\n\n` +
    `Sitemap: ${BASE}/sitemap.xml\n`;
  writeFileSync(resolve(ROOT, "public", "robots.txt"), robots, "utf8");

  console.log(`[sitemap] wrote ${entries.length} URLs (${countries.length} countries) + robots.txt`);
}

main();
