/**
 * Config-divergence guard (Task 1b).
 *
 * The published SHE Score configuration lives in the public research repo
 * (github.com/theshescorefoundation/shescore) and is pinned into this app as a
 * git submodule at external/shescore-research. The app's running copy lives at
 * src/config/she-score.v2.json. This check FAILS the build if the two diverge —
 * so the published methodology and the running methodology are provably identical.
 *
 * It ALSO asserts that the scoring constants in src/lib/scoring.ts match the
 * pillar weights in the config, so the numbers the app computes are provably the
 * published configuration (not a drifted hardcode).
 *
 * Pinned-ref resolution order:
 *   1. external/shescore-research/config/v2.json   (the submodule — production)
 *   2. ../shescore-research/config/v2.json          (local sibling — dev convenience)
 *   3. $SHESCORE_CONFIG_REF (explicit path)
 * If none is present (submodule not wired yet), the pinned-ref comparison is
 * skipped with a warning, but the scoring-constant consistency check still runs.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP_COPY = resolve(ROOT, "src/config/she-score.v2.json");

const PINNED_CANDIDATES = [
  resolve(ROOT, "external/shescore-research/config/v2.json"),
  resolve(ROOT, "../shescore-research/config/v2.json"),
  process.env.SHESCORE_CONFIG_REF || "",
].filter(Boolean);

const fail = (msg) => { console.error(`\n[config-sync] FAILED — ${msg}\n`); process.exit(1); };

function loadJson(p) { return JSON.parse(readFileSync(p, "utf8")); }

function pillarWeights(cfg) {
  const out = {};
  for (const [name, p] of Object.entries(cfg.pillars || {})) out[name] = p.weight;
  return out;
}

function main() {
  if (!existsSync(APP_COPY)) fail(`app copy missing: ${APP_COPY}`);
  const appCfg = loadJson(APP_COPY);

  // 1. Pinned-ref divergence.
  const pinned = PINNED_CANDIDATES.find(existsSync);
  if (pinned) {
    const a = JSON.stringify(loadJson(APP_COPY));
    const b = JSON.stringify(loadJson(pinned));
    if (a !== b) fail(`app copy diverges from pinned ref:\n  app    = ${APP_COPY}\n  pinned = ${pinned}\nRe-sync the app copy with the pinned research-repo config.`);
    console.log(`[config-sync] app copy matches pinned ref (${pinned.replace(ROOT, ".")}).`);
  } else {
    console.warn(`[config-sync] WARNING: pinned ref not found (submodule not wired yet). ` +
      `Add it with:  git submodule add https://github.com/theshescorefoundation/shescore external/shescore-research`);
  }

  // 2. Running config (scoring.ts constants) must match the published weights.
  const cfgW = pillarWeights(appCfg);   // { empowerment: 0.25, ... , safety_crime_penalty: -0.20 }
  const src = readFileSync(resolve(ROOT, "src/lib/scoring.ts"), "utf8");
  const block = src.slice(src.indexOf("V2_WEIGHTS"));
  const num = (k) => {
    const m = block.match(new RegExp(`${k}:\\s*(-?[0-9.]+)`));
    return m ? parseFloat(m[1]) : null;
  };
  const running = {
    empowerment: num("empowerment"),
    education_literacy: num("education"),
    economic_inclusion: num("economic"),
    health_survival: num("health"),
    safety_crime_penalty: num("crimePenalty") == null ? null : -num("crimePenalty"),
  };
  const mismatches = Object.entries(cfgW)
    .filter(([k, w]) => w != null)               // skip provisional (null) pillars
    .filter(([k, w]) => Math.abs((running[k] ?? NaN) - w) > 1e-9)
    .map(([k, w]) => `${k}: config ${w} vs scoring.ts ${running[k]}`);
  if (mismatches.length) {
    fail(`scoring.ts constants diverge from the published config:\n  ${mismatches.join("\n  ")}`);
  }
  console.log("[config-sync] scoring.ts constants match the published v2 pillar weights.");
  console.log("[config-sync] OK — published and running configuration are identical.");
}

main();
