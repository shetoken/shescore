import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { CountryWEI } from "@/lib/api";

// world-atlas@2, self-hosted (same-origin) so the map loads even where CDNs are
// blocked. Base-path aware for GitHub Pages project sites. ISO 3166-1 numeric IDs.
const GEO_URL = `${import.meta.env.BASE_URL}data/countries-110m.json`;

// ISO 3166-1 numeric → alpha-3 lookup (matches world-atlas feature ids to our API's iso_code)
const NUM_TO_ISO3: Record<string, string> = {
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

function scoreToColor(score: number | undefined | null): string {
  if (score == null) return "#1e293b";
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 45) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

const TIER_LABELS: Record<number, string> = {
  1: "Leading",
  2: "Advancing",
  3: "Lagging",
  4: "Critical",
};

const TIER_COLORS: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-yellow-400",
  3: "text-orange-400",
  4: "text-red-400",
};

interface TooltipState {
  country: string;
  iso: string;
  score: number | null;     // null = country has no data in active index
  tier: number;
  subnational: boolean;     // has state-level drill-down
  x: number;
  y: number;
}

interface WorldMapProps {
  countries: CountryWEI[];
  /** ISO alpha-3 of the currently selected country (highlights it in gold) */
  selectedIso?: string;
  /** If provided, clicking fires this instead of navigating to the country page */
  onSelect?: (country: CountryWEI) => void;
  /**
   * When a non-SHE Score index is active, supply a map of iso_code → score.
   * Countries missing from this map are rendered grey (no data).
   * When undefined, falls back to each country's she_score.
   */
  scoreOverride?: Map<string, number>;
  /** Index name shown in the tooltip, e.g. "SVI". Defaults to "SHE Score". */
  indexLabel?: string;
  /** Map canvas height in px. Default 500. */
  mapHeight?: number;
  /** ISO alpha-3 codes that have state-level drill-down — highlighted with a gold border + tooltip note. */
  subnationalIsos?: Set<string>;
  /** Override the fill colour for a score (e.g. travel-advisory tiers instead of SHE Score tiers). */
  colorFor?: (score: number | null | undefined) => string;
  /** Hide the built-in SHE Score-tier legend (e.g. when the page shows its own legend). */
  hideLegend?: boolean;
  /** Where to place the legend: "bottom" (default, horizontal under the map) or
      "left" (vertical stack in the same row, to the left of the map canvas). */
  legendSide?: "bottom" | "left";
  /** Optional content rendered above the left-stacked legend (e.g. a compact
      readout for the selected country). Only used when legendSide="left". */
  legendTop?: React.ReactNode;
  /** When set & non-empty, these ISO-A3 countries are brightened and the rest are dimmed
      (used to cross-highlight from the distribution chart on hover). */
  highlightIsos?: Set<string>;
  /** Fired with the hovered country (or null on leave) — lets the page cross-highlight
      the distribution chart and the tier donut from a map hover. */
  onHover?: (c: CountryWEI | null) => void;
}

export function WorldMap({
  countries,
  selectedIso,
  onSelect,
  scoreOverride,
  indexLabel = "SHE Score",
  mapHeight = 500,
  subnationalIsos,
  colorFor,
  hideLegend,
  legendSide = "bottom",
  legendTop,
  highlightIsos,
  onHover,
}: WorldMapProps) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Build lookup: iso_code → CountryWEI (for click/hover labels)
  const scoreMap = useMemo(
    () => new Map(countries.map((c) => [c.iso_code, c])),
    [countries]
  );

  // Resolve ISO-A3 from a geo numeric id, tolerating leading-zero differences
  // (e.g. world-atlas "076" vs table key "76").
  const isoForGeo = useCallback((geo: { id?: string | number }) => {
    const raw = String(geo.id ?? "");
    return NUM_TO_ISO3[raw] ?? NUM_TO_ISO3[String(Number(raw))];
  }, []);

  const getDataForGeo = useCallback(
    (geo: { id?: string | number }) => {
      const iso3 = isoForGeo(geo);
      return iso3 ? scoreMap.get(iso3) ?? null : null;
    },
    [scoreMap, isoForGeo]
  );

  /** Resolve the display score: scoreOverride if provided, else SHE Score */
  const getDisplayScore = useCallback(
    (iso3: string | undefined): number | null => {
      if (!iso3) return null;
      if (scoreOverride) {
        return scoreOverride.get(iso3) ?? null;   // null = grey, not in index
      }
      return scoreMap.get(iso3)?.she_score ?? null;
    },
    [scoreOverride, scoreMap]
  );

  const handleEnter = useCallback(
    (geo: { id?: string | number }, evt: React.MouseEvent) => {
      const data = getDataForGeo(geo);
      if (!data) return;
      const iso3 = isoForGeo(geo);
      onHover?.(data);
      setTooltip({
        country: data.country,
        iso:     data.iso_code,
        score:   getDisplayScore(iso3),
        tier:    data.tier,
        subnational: !!subnationalIsos?.has(data.iso_code),
        x:       evt.clientX,
        y:       evt.clientY,
      });
    },
    [getDataForGeo, getDisplayScore, subnationalIsos, isoForGeo, onHover]
  );

  const handleMove = useCallback((evt: React.MouseEvent) => {
    setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : null));
  }, []);

  const handleLeave = useCallback(() => { setTooltip(null); onHover?.(null); }, [onHover]);

  const handleClick = useCallback(
    (geo: { id?: string | number }) => {
      const data = getDataForGeo(geo);
      if (!data) return;
      if (onSelect) {
        onSelect(data);
      } else {
        navigate(`/scores/${data.iso_code}`);
      }
    },
    [getDataForGeo, navigate, onSelect]
  );

  // Legend items (shared by the bottom + left layouts).
  const legendSwatches = [
    { color: "#10b981", label: "75+  High" },
    { color: "#22c55e", label: "60–74  Good" },
    { color: "#eab308", label: "45–59  Moderate" },
    { color: "#f97316", label: "30–44  Low" },
    { color: "#ef4444", label: "<30  Critical" },
    { color: "#1e293b", label: "No data" },
  ];
  const renderLegend = (vertical: boolean) => (
    <div className={`text-xs text-muted-foreground ${vertical
      ? "flex flex-col items-start gap-1.5 shrink-0 self-start"
      : "flex flex-wrap items-center gap-x-4 gap-y-1 justify-start mt-2"}`}>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0 border-2" style={{ backgroundColor: "#475569", borderColor: "#ffffff" }} />
        Selected
      </span>
      {legendSwatches.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
      {subnationalIsos && subnationalIsos.size > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-2 inline-block flex-shrink-0 rounded-sm border-2 border-dashed" style={{ borderColor: "#fcd34d" }} />
          State-level data
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative w-full select-none ${legendSide === "left" ? "h-full flex flex-col" : ""}`}>
      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-border/60 rounded-xl px-4 py-3 shadow-card text-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 84 }}
        >
          <p className="font-semibold">{tooltip.country}</p>
          {tooltip.score != null ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {indexLabel} Score:{" "}
              <span className="font-bold text-foreground">{tooltip.score.toFixed(1)}</span>
              {indexLabel === "SHE Score" && (
                <>
                  {" · "}
                  <span className={TIER_COLORS[tooltip.tier]}>
                    {TIER_LABELS[tooltip.tier]}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              No {indexLabel} data
            </p>
          )}
          {tooltip.subnational && (
            <p className="text-xs mt-1 inline-flex items-center gap-1 font-medium" style={{ color: "#fcd34d" }}>
              📍 State-level data available
            </p>
          )}
          <p className="text-xs text-magenta-ink mt-1">
            {onSelect ? "Click to select →" : "Click to explore →"}
          </p>
        </div>
      )}

      {/* Interaction hint — above the map (bottom-legend layout only; the
          left layout shows it inside the legend column instead) */}
      {legendSide !== "left" && (
        <p className="text-left text-[11px] text-muted-foreground/40 mb-1 shrink-0">
          Scroll to zoom · Drag to pan · Click a country to select
        </p>
      )}

      {/* Map canvas (+ optional left-stacked legend in the same row) */}
      <div className={legendSide === "left" ? "flex items-stretch gap-4 flex-1 min-h-0" : ""}>
        {legendSide === "left" && (
          <div className="flex flex-col gap-2.5 shrink-0 self-start max-w-[130px]">
            {legendTop}
            <p className="text-[10px] text-muted-foreground/50 leading-snug">
              Scroll to zoom · Drag to pan · Click a country to select
            </p>
            {!hideLegend && renderLegend(true)}
          </div>
        )}
        <div className={`rounded-2xl overflow-hidden border border-border/30 bg-[#0f172a] ${legendSide === "left" ? "flex-1 min-w-0 flex items-start justify-center" : ""}`}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 138, center: [10, 18] }}
          height={mapHeight}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup zoom={1} minZoom={0.7} maxZoom={8}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const data        = getDataForGeo(geo);
                  const iso3        = isoForGeo(geo);
                  const displayScore = getDisplayScore(iso3);
                  const isSelected  = !!selectedIso && data?.iso_code === selectedIso;
                  // Keep the country's scale colour and mark selection with a white
                  // outline — recolouring it gold collides with the yellow tiers.
                  const fill        = colorFor ? colorFor(displayScore) : scoreToColor(displayScore);
                  const hasData     = !!data;   // clickable if SHE Score record exists
                  const hasSub      = !!data && !!subnationalIsos?.has(data.iso_code);
                  const isHi        = !!highlightIsos && !!data && highlightIsos.has(data.iso_code);
                  const dim         = !!highlightIsos && highlightIsos.size > 0 && !isHi;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      fillOpacity={dim ? 0.2 : 1}
                      stroke={isHi ? "#ffffff" : isSelected ? "#ffffff" : hasSub ? "#fcd34d" : "#0f172a"}
                      strokeWidth={isHi ? 1.5 : isSelected ? 2 : hasSub ? 1 : 0.4}
                      strokeDasharray={hasSub && !isSelected ? "2 1.5" : undefined}
                      style={{
                        default: {
                          outline: "none",
                          cursor: hasData ? "pointer" : "default",
                        },
                        hover: {
                          outline: "none",
                          fill: hasData ? (isSelected ? fill : "#a78bfa") : fill,
                          cursor: hasData ? "pointer" : "default",
                        },
                        pressed: { outline: "none", fill },
                      }}
                      onMouseEnter={(evt) => handleEnter(geo, evt)}
                      onMouseMove={handleMove}
                      onMouseLeave={handleLeave}
                      onClick={() => handleClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        </div>
      </div>

      {/* Legend — bottom (horizontal) layout; "left" is rendered in the row above */}
      {!hideLegend && legendSide !== "left" && renderLegend(false)}
    </div>
  );
}
