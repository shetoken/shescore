/**
 * Generates public/data/fallback-countries.json from the committed baseline CSV
 * (data/baseline-2025.csv). The frontend uses this as a graceful fallback when
 * the live scoring API (api.shetoken.org) is unavailable, so the dashboard and
 * safety map still show real v2 baseline numbers instead of breaking.
 *
 * NOTE: baseline = the published v2 five-pillar scores. v3 pillars are absent
 * (left null). safety_justice_score is derived as 100 − crime_penalty for the
 * safety advisory; violence_penalty_score mirrors the crime penalty.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "data/baseline-2025.csv");
const OUT_DIR = resolve(ROOT, "public/data");

function main() {
  let raw;
  try { raw = readFileSync(CSV, "utf8"); }
  catch { console.warn("[gen-fallback] baseline CSV not found — skipping"); return; }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (!lines.length) { console.warn("[gen-fallback] no data rows"); return; }
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (k) => header.indexOf(k);
  const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

  const countries = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    if (!c[idx("iso_code")]) continue;
    const crime = num(c[idx("crime_penalty_score")]);
    countries.push({
      rank: num(c[idx("rank")]),
      country: c[idx("country")],
      iso_code: c[idx("iso_code")],
      ticker: c[idx("ticker")] || `SHE-${c[idx("iso_code")]}`,
      region: c[idx("region")] || "",
      tier: num(c[idx("tier")]),
      population_millions: num(c[idx("population_millions")]),
      wei_score: num(c[idx("wei_score")]),
      weekly_delta: 0,
      empowerment_score: num(c[idx("empowerment_score")]),
      education_score: num(c[idx("education_score")]),
      economic_score: num(c[idx("economic_score")]),
      health_score: num(c[idx("health_score")]),
      crime_penalty_score: crime,
      // derived for the safety advisory + penalty display
      safety_justice_score: Math.max(0, Math.min(100, 100 - crime)),
      violence_penalty_score: crime,
      // v3 pillars are not in baseline data
      bodily_autonomy_score: null,
      dignity_welfare_score: null,
      digital_social_score: null,
      year: num(c[idx("year")]) || 2025,
    });
  }

  countries.sort((a, b) => b.wei_score - a.wei_score);
  countries.forEach((c, i) => { c.rank = i + 1; });

  const n = countries.length;
  const avg = n ? countries.reduce((s, c) => s + c.wei_score, 0) / n : 0;
  const tier = (t) => countries.filter((c) => c.tier === t).length;
  const highest = countries[0], lowest = countries[n - 1];
  const summary = {
    global_wei_score: Number(avg.toFixed(1)),
    countries_scored: n,
    tier_1_count: tier(1), tier_2_count: tier(2), tier_3_count: tier(3), tier_4_count: tier(4),
    highest_country: highest?.country ?? "", highest_score: highest?.wei_score ?? 0,
    lowest_country: lowest?.country ?? "", lowest_score: lowest?.wei_score ?? 0,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "fallback-countries.json"), JSON.stringify({ generated: "baseline-2025", countries, summary }), "utf8");
  console.log(`[gen-fallback] wrote public/data/fallback-countries.json (${n} countries)`);
}

main();
