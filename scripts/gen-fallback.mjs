/**
 * Generates public/data/fallback-countries.json — the committed dataset the app
 * uses when the live API host is unreachable.
 *
 * Source of truth at build time: the live scoring API (full 105-country set).
 * If that is unreachable at build, falls back to the committed baseline CSV
 * (data/baseline-2025.csv, 83 countries). The generated JSON contains only
 * country score data — no token-branded strings reach the served bundle.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "data/baseline-2025.csv");
const OUT_DIR = resolve(ROOT, "public/data");
const API = "https://api.shetoken.org/v1/wei/countries?limit=105&sort=wei_score&order=desc";

const round1 = (x) => Math.sign(x) * Math.round(Math.abs(x) * 10) / 10;
// Published v2 five-pillar formula. We compute this from the pillar sub-scores so
// the dataset is the OFFICIAL v2 score (the live API's wei_score is the legacy
// 8-pillar value and must not be used directly).
function v2Score(E, Ed, Ec, H, C) {
  return round1(E * 0.25 + Ed * 0.20 + Ec * 0.20 + H * 0.15 - C * 0.20);
}
const tierFor = (s) => (s >= 60 ? 1 : s >= 45 ? 2 : s >= 30 ? 3 : 4);

function shape(c) {
  const crime = Number(c.crime_penalty_score ?? c.violence_penalty_score ?? 0) || 0;
  const E = Number(c.empowerment_score) || 0, Ed = Number(c.education_score) || 0;
  const Ec = Number(c.economic_score) || 0, H = Number(c.health_score) || 0;
  const v2 = v2Score(E, Ed, Ec, H, crime);
  return {
    rank: c.rank ?? 0,
    country: c.country,
    iso_code: c.iso_code,
    ticker: c.ticker || `SHE-${c.iso_code}`,
    region: c.region || "",
    tier: tierFor(v2),
    population_millions: Number(c.population_millions) || 0,
    wei_score: v2,
    weekly_delta: 0,
    empowerment_score: Number(c.empowerment_score) || 0,
    education_score: Number(c.education_score) || 0,
    economic_score: Number(c.economic_score) || 0,
    health_score: Number(c.health_score) || 0,
    crime_penalty_score: Number(crime) || 0,
    safety_justice_score: c.safety_justice_score ?? Math.max(0, Math.min(100, 100 - (Number(crime) || 0))),
    violence_penalty_score: Number(crime) || 0,
    bodily_autonomy_score: null,
    dignity_welfare_score: null,
    digital_social_score: null,
    year: c.year || 2025,
  };
}

async function fromApi() {
  const res = await fetch(API, { signal: AbortSignal.timeout(15000) });
  const json = await res.json();
  const data = json.data ?? json ?? [];
  if (!Array.isArray(data) || !data.length) throw new Error("empty API response");
  return data.map(shape);
}

function fromCsv() {
  const raw = readFileSync(CSV, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (k) => header.indexOf(k);
  const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    if (!c[idx("iso_code")]) continue;
    out.push(shape({
      rank: num(c[idx("rank")]), country: c[idx("country")], iso_code: c[idx("iso_code")],
      ticker: c[idx("ticker")], region: c[idx("region")], tier: num(c[idx("tier")]),
      population_millions: num(c[idx("population_millions")]),
      wei_score: num(c[idx("she_score")] >= 0 ? c[idx("she_score")] : c[idx("wei_score")]),
      empowerment_score: num(c[idx("empowerment_score")]), education_score: num(c[idx("education_score")]),
      economic_score: num(c[idx("economic_score")]), health_score: num(c[idx("health_score")]),
      crime_penalty_score: num(c[idx("crime_penalty_score")]), year: num(c[idx("year")]),
    }));
  }
  return out;
}

async function main() {
  let countries, source;
  try { countries = await fromApi(); source = "live-api"; }
  catch (e) {
    console.warn(`[gen-fallback] live API unavailable (${e}); using baseline CSV`);
    try { countries = fromCsv(); source = "baseline-csv"; }
    catch { console.warn("[gen-fallback] no CSV either — skipping"); return; }
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
  writeFileSync(resolve(OUT_DIR, "fallback-countries.json"), JSON.stringify({ generated: source, countries, summary }), "utf8");
  console.log(`[gen-fallback] wrote public/data/fallback-countries.json (${n} countries, source: ${source})`);
}

main();
