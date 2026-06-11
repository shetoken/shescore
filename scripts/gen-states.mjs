// One-off: bake the data-engine's sub-national CSVs into a clean baseline JSON
// (state, code, region, she_score, safety_justice_score only — no tickers/notes).
import fs from "node:fs";

const SRC = {
  india: "india-states", usa: "usa-states", brazil: "brazil-states",
  nigeria: "nigeria-states", mexico: "mexico-states", pakistan: "pakistan-provinces",
};
const BASE = "../shetoken-data-engine/api/data/output";

// Tolerant CSV line splitter (handles quoted fields with commas).
function splitCsv(line) {
  const cells = []; let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}

const out = {};
for (const [name, file] of Object.entries(SRC)) {
  const raw = fs.readFileSync(`${BASE}/${file}-2025.csv`, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
  const hdr = splitCsv(lines[0]);
  const ix = Object.fromEntries(hdr.map((h, i) => [h, i]));
  const sCol = ix.state != null ? "state" : "province";
  const cCol = ix.state_code != null ? "state_code" : "province_code";
  const regionCol = ix.region != null ? "region" : (ix.zone != null ? "zone" : null);
  const num = (cells, k) => { const v = cells[ix[k]]; return v === "" || v == null ? null : Number(v); };
  out[name] = lines.slice(1).map(splitCsv).map((c) => ({
    state: c[ix[sCol]],
    state_code: c[ix[cCol]],
    region: regionCol ? c[ix[regionCol]] : undefined,
    she_score: num(c, "wei_score"),
    safety_justice_score: num(c, "safety_justice_score"),
  })).filter((r) => r.state);
}
fs.writeFileSync("public/data/states.json", JSON.stringify({
  generated: "baseline",
  note: "Sub-national women's empowerment & safety scores.",
  countries: out,
}));
console.log("wrote", Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(", "));
