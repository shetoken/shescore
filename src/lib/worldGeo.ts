/**
 * Shared world-geography helpers: the world-atlas source, the numeric→ISO3
 * lookup, the SHE Score colour scale, and an offscreen choropleth → PNG rasteriser
 * used to embed the world map in the country-report PDF (jsPDF can't draw SVG).
 */
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

// world-atlas@2 via npm CDN — ISO 3166-1 numeric feature IDs
export const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 numeric → alpha-3 (matches world-atlas feature ids to our API's iso_code)
export const NUM_TO_ISO3: Record<string, string> = {
  "4": "AFG", "8": "ALB", "12": "DZA", "24": "AGO", "32": "ARG",
  "36": "AUS", "40": "AUT", "31": "AZE", "50": "BGD", "56": "BEL",
  "64": "BTN", "68": "BOL", "70": "BIH", "76": "BRA", "100": "BGR",
  "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", "120": "CMR",
  "124": "CAN", "140": "CAF", "144": "LKA", "148": "TCD", "152": "CHL",
  "156": "CHN", "170": "COL", "178": "COG", "180": "COD", "188": "CRI",
  "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE", "204": "BEN",
  "208": "DNK", "214": "DOM", "218": "ECU", "222": "SLV", "231": "ETH",
  "232": "ERI", "233": "EST", "246": "FIN", "250": "FRA", "266": "GAB",
  "268": "GEO", "276": "DEU", "288": "GHA", "300": "GRC", "320": "GTM",
  "324": "GIN", "332": "HTI", "340": "HND", "348": "HUN", "356": "IND",
  "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL", "376": "ISR",
  "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ",
  "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT",
  "417": "KGZ", "418": "LAO", "422": "LBN", "428": "LVA", "430": "LBR",
  "434": "LBY", "440": "LTU", "450": "MDG", "454": "MWI", "458": "MYS",
  "462": "MDV", "466": "MLI", "484": "MEX", "496": "MNG", "498": "MDA",
  "504": "MAR", "508": "MOZ", "516": "NAM", "524": "NPL", "528": "NLD",
  "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR",
  "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER",
  "608": "PHL", "616": "POL", "620": "PRT", "630": "PRI", "634": "QAT",
  "642": "ROU", "643": "RUS", "646": "RWA", "682": "SAU", "686": "SEN",
  "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM", "706": "SOM",
  "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", "729": "SDN",
  "740": "SUR", "748": "SWZ", "752": "SWE", "756": "CHE", "760": "SYR",
  "762": "TJK", "764": "THA", "768": "TGO", "780": "TTO", "784": "ARE",
  "788": "TUN", "792": "TUR", "795": "TKM", "800": "UGA", "804": "UKR",
  "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA",
  "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "887": "YEM",
  "894": "ZMB", "51": "ARM",
};

/** SHE Score → choropleth colour (matches the dashboard map legend). */
export function scoreToColor(score: number | undefined | null): string {
  if (score == null) return "#283143";
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 45) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

export const MAP_SELECTED_COLOR = "#f59e0b";
const isoForNum = (raw: string) => NUM_TO_ISO3[raw] ?? NUM_TO_ISO3[String(Number(raw))];

const _mapCache: Record<string, string | null> = {};

/**
 * Render a world choropleth (Equal-Earth) coloured by SHE Score, with the selected
 * country in gold, and return it as a PNG data URL. Null on any failure.
 */
export async function getCountryMapPng(opts: {
  scoreByIso: Record<string, number>;
  selectedIso?: string;
  width?: number;
  height?: number;
}): Promise<string | null> {
  const W = opts.width ?? 760, H = opts.height ?? 360;
  const key = `${opts.selectedIso ?? ""}|${W}x${H}`;
  if (key in _mapCache) return _mapCache[key];
  try {
    const topo = await (await fetch(GEO_URL)).json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = feature(topo, topo.objects.countries) as any;
    const feats = (fc.features as Array<{ id?: string | number }>).filter((f) => String(f.id) !== "10"); // drop Antarctica
    const proj = geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: "FeatureCollection", features: feats } as never);
    const path = geoPath(proj);
    let paths = "";
    let selPath = ""; // drawn last so its bright outline sits on top of neighbours
    for (const f of feats) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = path(f as any);
      if (!d) continue;
      const iso = isoForNum(String(f.id));
      const sel = !!iso && !!opts.selectedIso && iso === opts.selectedIso;
      if (sel) {
        selPath = `<path d="${d}" fill="${MAP_SELECTED_COLOR}" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>`;
        continue;
      }
      const fill = scoreToColor(iso ? opts.scoreByIso[iso] ?? null : null);
      paths += `<path d="${d}" fill="${fill}" stroke="#0b0712" stroke-width="0.4"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0d0a16"/>${paths}${selPath}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image(); img.width = W; img.height = H;
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("map img")); img.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    _mapCache[key] = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("world-map rasterisation failed:", e);
    _mapCache[key] = null;
  }
  return _mapCache[key];
}
