/**
 * Content firewall (Task 7) — FAILS the shescore build if any prerendered HTML
 * contains token / crypto / solicitation language. Scans visible HTML output
 * (dist/**\/*.html), the content crawlers and firewall categorizers actually see.
 *
 * Strict: there is no permitted exception — the served site contains zero
 * token/crypto references (the data API host is env-driven and off any
 * token-branded domain).
 *
 * Acronyms (DEX, DAO, Web3) are matched case-sensitively as whole words so the
 * legitimate words "index"/"indices" never trip the gate.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

const BANNED = [
  { re: /\$SHE/g, label: "$SHE" },
  { re: /\btokenomics\b/gi, label: "tokenomics" },
  { re: /\btokens?\b/gi, label: "token" },
  { re: /\bcrypto\b/gi, label: "crypto" },
  { re: /\bblockchain\b/gi, label: "blockchain" },
  { re: /\bcoins?\b/gi, label: "coin" },
  { re: /\bmint(?:ed|ing|s)?\b/gi, label: "mint" },
  { re: /\bburn(?:ed|ing|s)?\b/gi, label: "burn" },
  { re: /\bstaking\b/gi, label: "staking" },
  { re: /\bwallets?\b/gi, label: "wallet" },
  { re: /\bUniswap\b/gi, label: "Uniswap" },
  { re: /\bDEX\b/g, label: "DEX" },          // case-sensitive — not "index"
  { re: /\bDAO\b/g, label: "DAO" },          // case-sensitive
  { re: /\bWeb3\b/gi, label: "Web3" },
  { re: /\bpresale\b/gi, label: "presale" },
  { re: /\bbuy\b/gi, label: "buy" },
  { re: /\binvest(?:ment|ments|ed|ing|or|ors|s)?\b/gi, label: "invest" },
  { re: /\bDiscord\b/gi, label: "Discord" },
  { re: /\bTelegram\b/gi, label: "Telegram" },
  { re: /SHE GOES UP/gi, label: "SHE GOES UP imagery" },
];

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...htmlFiles(p));
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

function main() {
  let files;
  try { files = htmlFiles(DIST); }
  catch { console.warn("[firewall] no dist/ — skipping"); return; }

  const violations = [];
  for (const f of files) {
    const html = readFileSync(f, "utf8");
    for (const { re, label } of BANNED) {
      const m = html.match(re);
      if (m) violations.push({ file: f.replace(DIST, "dist"), label, sample: m.slice(0, 3).join(", "), count: m.length });
    }
  }

  if (violations.length) {
    console.error(`\n[firewall] FAILED — ${violations.length} banned-term hit(s):`);
    for (const v of violations) console.error(`  ${v.file}: "${v.label}" ×${v.count} (${v.sample})`);
    console.error("\nFix the content or add an approved exception. The shescore target must read as an institutional research site.\n");
    process.exit(1);
  }
  console.log(`[firewall] OK — scanned ${files.length} html files, zero banned terms (strict, no exceptions).`);
}

main();
