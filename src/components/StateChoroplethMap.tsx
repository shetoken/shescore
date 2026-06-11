import { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { StateScore } from "@/lib/api";

interface Advisory { label: string; color: string; }
export interface CityLabel { city: string; state: string; coords: [number, number]; }

const norm = (s: string) => (s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const ALIAS: Record<string, string> = {
  orissa: "odisha", telengana: "telangana", uttaranchal: "uttarakhand",
  nctofdelhi: "delhi", delhinct: "delhi", pondicherry: "puducherry",
};
export const stateKey = (s: string) => { const n = norm(s); return ALIAS[n] || n; };

interface Hover { name: string; score: number | null; she: number | null; advisory: Advisory | null; x: number; y: number; }

/* Sub-national choropleth (state polygons), shaded by the Safety & Justice score
   with a synced external highlight (hover a side-list row to light the state). */
export function StateChoroplethMap({
  geoUrl, nameKey, projection, projectionConfig, states, advisoryFor, cities, height = 520,
  hoveredKey, onHoverKey,
}: {
  geoUrl: string;
  nameKey: string;
  projection: string;
  projectionConfig: Record<string, unknown>;
  states: StateScore[];
  advisoryFor: (score: number) => Advisory;
  cities?: CityLabel[];
  height?: number;
  hoveredKey?: string | null;
  onHoverKey?: (k: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, StateScore>();
    states.forEach((s) => m.set(stateKey(s.state), s));
    return m;
  }, [states]);

  const pos = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  const onMove = (e: React.MouseEvent) => { const p = pos(e); setHover((h) => (h ? { ...h, ...p } : h)); };

  return (
    <div ref={wrapRef} className="relative rounded-2xl border border-border/40 bg-[#0f172a] p-1 shadow-card" onMouseMove={onMove}>
      <ComposableMap key={geoUrl} projection={projection} projectionConfig={projectionConfig}
                     width={800} height={height} style={{ width: "100%", height: "auto" }}>
        <Geographies key={geoUrl} geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const gname = (geo.properties?.[nameKey] as string) ?? "";
              const gkey = stateKey(gname);
              const st = lookup.get(gkey);
              const adv = st ? advisoryFor(st.safety_justice_score ?? 0) : null;
              const isHi = hoveredKey != null && gkey === hoveredKey;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => { setHover({
                    name: st?.state ?? gname,
                    score: st ? (st.safety_justice_score ?? 0) : null,
                    she: st ? (st.she_score ?? 0) : null,
                    advisory: adv, ...pos(e),
                  }); onHoverKey?.(gkey); }}
                  onMouseLeave={() => { setHover(null); onHoverKey?.(null); }}
                  style={{
                    default: { fill: adv ? (isHi ? adv.color : `${adv.color}cc`) : (isHi ? "#334155" : "#1e293b"), stroke: isHi ? "#ffffff" : "#0f172a", strokeWidth: isHi ? 1.1 : 0.5, outline: "none" },
                    hover:   { fill: adv ? adv.color : "#334155", stroke: "#ffffff", strokeWidth: 0.9, outline: "none", cursor: "pointer" },
                    pressed: { fill: adv ? adv.color : "#334155", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {cities?.map((c) => (
          <Marker key={c.city} coordinates={c.coords} style={{ default: { pointerEvents: "none" } }}>
            <g style={{ pointerEvents: "none" }}>
              <circle r={2.4} fill="#f8fafc" stroke="#0f172a" strokeWidth={0.6} />
              <text x={4} y={3} fontSize={9} fill="#f8fafc" style={{ paintOrder: "stroke" }} stroke="#0f172a" strokeWidth={2}>{c.city}</text>
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {hover && (
        <div className="pointer-events-none absolute z-20 rounded-lg border bg-popover/95 backdrop-blur px-3 py-2 shadow-card text-xs w-52"
             style={{ left: Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 300) - 220), top: Math.max(hover.y - 10, 0),
                      borderColor: hover.advisory ? `${hover.advisory.color}55` : "hsl(var(--border))" }}>
          <div className="font-bold text-sm mb-1">{hover.name}</div>
          {hover.advisory ? (
            <>
              <div className="font-semibold mb-1.5" style={{ color: hover.advisory.color }}>{hover.advisory.label}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Safety &amp; Justice</span>
                <span className="font-medium" style={{ color: hover.advisory.color }}>{Number(hover.score).toFixed(0)}/100</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overall SHE Score</span>
                <span className="font-medium">{Number(hover.she).toFixed(1)}/100</span></div>
            </>
          ) : (
            <div className="text-muted-foreground">No data for this region.</div>
          )}
        </div>
      )}
    </div>
  );
}
