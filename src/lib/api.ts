const API_BASE = 'https://api.shetoken.org';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

/* ── Field adapter ────────────────────────────────────────────────────────
   The backend API still emits `wei_score` / `global_wei_score`. The frontend
   speaks `she_score` / `global_she_score`. We normalise once, here, at the API
   boundary — every component downstream uses the SHE-named fields. (The raw
   `wei_score` is preserved on the object too, so backend-shaped field
   accessors keep working.) Renaming the API itself is a separate backend
   decision; the `/v1/wei/*` URLs are unchanged. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const normCountry = (c: any): CountryWEI => ({ ...c, she_score: c.she_score ?? c.wei_score });
const normState = (s: any): StateScore => ({ ...s, she_score: s.she_score ?? s.wei_score });
const normSummary = (s: any): Summary => ({ ...s, global_she_score: s.global_she_score ?? s.global_wei_score });

/* ── Offline fallback ─────────────────────────────────────────────────────
   When the live scoring API is unavailable, fall back to the committed v2
   baseline dataset (public/data/fallback-countries.json) so the dashboard and
   safety map still show real numbers. Sets a window flag so the UI can show a
   "baseline data — live API offline" notice. */
let _fallbackCache: { countries: any[]; summary: any } | null = null;
async function loadFallback() {
  if (_fallbackCache) return _fallbackCache;
  const res = await fetch("/data/fallback-countries.json");
  if (!res.ok) throw new Error("no fallback data");
  _fallbackCache = await res.json();
  return _fallbackCache!;
}
function markFallback() { try { (window as any).__sheApiFallback = true; } catch { /* ssr */ } }
export function isApiFallback() { try { return !!(window as any).__sheApiFallback; } catch { return false; } }
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Weekly scan stats emitted by the SHEtoken data agent. */
export interface ScanStats {
  week: string;
  scanned_at: string;
  rss_count: number;
  youtube_count: number;
  reddit_count: number;
  gdelt_count: number;
  research_count: number;
  social_count: number;
  llm_scout_count: number;
  total_fetched: number;
  total_after_dedup: number;
  signals_found: number;
  crisis_signals: number;
}

export interface Summary {
  global_she_score: number;
  countries_scored: number;
  india_wei: number;
  tier_1_count: number;
  tier_2_count: number;
  tier_3_count: number;
  tier_4_count: number;
  highest_country: string;
  highest_score: number;
  lowest_country: string;
  lowest_score: number;
  last_updated: string;
  /**
   * Pre-computed global averages for the 7 non-SHE Score indexes.
   * Added to GET /v1/summary by the data-engine pipeline.
   * Frontend falls back to client-side averaging until these fields are present.
   */
  gpi_global_avg?: number;
  svi_global_avg?: number;
  wadi_global_avg?: number;
  wevi_global_avg?: number;
  whi_global_avg?: number;
  wvi_global_avg?: number;
  compliance_global_avg?: number;
  /** Latest run scan stats — null until the agent has run at least once. */
  scan_stats?: ScanStats | null;
}

export interface PerformanceSource {
  title: string;
  url: string;
  source: string;
  date: string;
  pillar: string;
}

export interface CountryWEI {
  rank: number;
  country: string;
  iso_code: string;
  ticker: string;
  region: string;
  tier: number;
  population_millions: number;
  she_score: number;
  weekly_delta: number;
  empowerment_score: number;
  education_score: number;
  economic_score: number;
  health_score: number;
  bodily_autonomy_score: number;
  safety_justice_score: number;
  dignity_welfare_score: number;
  digital_social_score: number;
  violence_penalty_score: number;
  year: number;
  // SLM-generated fields (present when pipeline has run and signals exist)
  performance_summary?: string;
  sources?: PerformanceSource[];
}

export interface CountryListResponse {
  count: number;
  data: CountryWEI[];
}

export interface StateScore {
  rank: number;
  state: string;
  state_code: string;
  region?: string;
  she_score: number;
  safety_justice_score?: number;
  [key: string]: unknown;
}

export interface StateListResponse {
  country: string;
  count: number;
  data: StateScore[];
}

export interface CountryHistory {
  iso_code: string;
  country: string;
  years?: number;
  from_year?: number;
  to_year?: number;
  data: Array<Record<string, number | string>>;
}

export interface LifepathStage {
  stage: string;
  age_band: string;
  headline: string;
  cohort?: string;
  detail?: string;
  felt?: string;
  note?: string;
  source?: string;
}

export interface LifepathMilestone {
  label: string;
  reached: number;   // share of 100 girls who clear this hurdle
  stage: string;
}

export interface Lifepath {
  country: string;
  iso_code: string;
  cohort_size?: number;
  disclaimer?: string;
  stages: LifepathStage[];
  milestones?: LifepathMilestone[];
}

export interface AllCountryHistory {
  years: number[];
  global_avg: (number | null)[];
  countries: { iso_code: string; country: string; scores: (number | null)[] }[];
}

/** Per-country women's vital statistics + weekly estimates (for the She-Clock). */
export interface VitalStats {
  country: string;
  iso_code: string;
  region: string;
  life_expectancy_female?: number;
  maternal_mortality_per_100k?: number;
  women_killed_by_partner_per_100k?: number;
  girls_born_per_week_est?: number;
  maternal_deaths_per_week_est?: number;
  girls_drop_out_school_per_week_est?: number;
  girls_married_under18_per_week_est?: number;
  women_killed_by_partner_per_week_est?: number;
  women_facing_sexual_violence_per_week_est?: number;
  girls_not_born_per_week_est?: number;
  [key: string]: unknown;
}

export interface IndexScore {
  iso_code?: string;
  country?: string;
  score?: number;
  rank?: number;
  [key: string]: unknown;
}

/** Per-indicator data provenance from GET /v1/methodology. */
export interface IndicatorProvenance {
  source: string;
  year: string;
  status: "verified" | "modeled" | "derived";
}
export interface MethodologyProvenance {
  version: string;
  generated: string;
  note?: string;
  /** indexes[indexCode][fieldOrLabel] = provenance */
  indexes: Record<string, Record<string, IndicatorProvenance>>;
}

/* v3 SHADOW preview (Track C). Consumes ONLY the shadow endpoint — never falls
   back to v2 data. Throws if unavailable so the Lab/country panel can show their
   own "shadow data unavailable" state. */
export interface V3PreviewRow {
  iso_code: string; country: string; version: string; status: string; score: number;
  coverage?: { used: number; weighted: number; missing: string[] };
  candidate_pillars_with_data?: Record<string, boolean>;
}
export interface V3PreviewResponse {
  version: string; status: string; notice: string; count: number;
  pillar_coverage: Record<string, string>; data: V3PreviewRow[];
}

export const api = {
  summary: () => apiFetch<Summary>('/v1/summary').then(normSummary)
    .catch(async () => { markFallback(); const f = await loadFallback(); return normSummary(f.summary); }),

  // SHADOW only — no v2 fallback (Track C C4).
  v3Preview: () => apiFetch<V3PreviewResponse>('/api/v3-preview/scores'),
  v3PreviewCountry: (iso: string) =>
    apiFetch<V3PreviewResponse>('/api/v3-preview/scores').then((r) => {
      const row = (r.data ?? []).find((x) => x.iso_code?.toUpperCase() === iso.toUpperCase());
      if (!row) throw new Error("no shadow score");
      return { row, pillar_coverage: r.pillar_coverage, notice: r.notice };
    }),

  wei: {
    countries: (limit = 105) =>
      apiFetch<CountryListResponse>(`/v1/wei/countries?limit=${limit}&sort=wei_score&order=desc`)
        .then((r) => ({ ...r, data: (r.data ?? []).map(normCountry) }))
        .catch(async () => { markFallback(); const f = await loadFallback(); return { count: f.countries.length, data: f.countries.slice(0, limit).map(normCountry) }; }),
    country: (iso: string) =>
      apiFetch<CountryWEI>(`/v1/wei/countries/${iso}`).then(normCountry)
        .catch(async () => { markFallback(); const f = await loadFallback(); const c = f.countries.find((x: { iso_code: string }) => x.iso_code === iso); if (!c) throw new Error("not found"); return normCountry(c); }),
    history: (iso: string) =>
      apiFetch<CountryHistory>(`/v1/wei/history/country/${iso}`),
    globalTrend: () =>
      apiFetch<Array<Record<string, number | string>>>('/v1/wei/history/global-trend'),
    allHistory: () =>
      apiFetch<AllCountryHistory>('/v1/wei/history/all-countries'),
    leaderboard: (limit = 10) =>
      apiFetch<CountryWEI[]>(`/v1/wei/leaderboard?limit=${limit}`).then((a) => (a ?? []).map(normCountry)),
    states: (country: string) =>
      apiFetch<StateListResponse>(`/v1/wei/states/${country}`)
        .then((r) => ({ ...r, data: (r.data ?? []).map(normState) }))
        .catch(() => { markFallback(); return { count: 0, data: [] as StateScore[] } as StateListResponse; }),
  },

  gpi: {
    all: () => apiFetch<IndexScore[]>('/v1/gpi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/gpi/${iso}`),
  },

  svi: {
    all: () => apiFetch<IndexScore[]>('/v1/svi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/svi/${iso}`),
  },

  wadi: {
    all: () => apiFetch<IndexScore[]>('/v1/wadi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wadi/${iso}`),
  },

  wevi: {
    all: () => apiFetch<IndexScore[]>('/v1/wevi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wevi/${iso}`),
  },

  whi: {
    all: () => apiFetch<IndexScore[]>('/v1/whi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/whi/${iso}`),
  },

  wvi: {
    all: () => apiFetch<IndexScore[]>('/v1/wvi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wvi/${iso}`),
  },

  compliance: {
    countries: () => apiFetch<IndexScore[]>('/v1/compliance/countries'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/compliance/countries/${iso}`),
  },

  lifepath: (iso: string) => apiFetch<Lifepath>(`/v1/lifepath/${iso}`),

  vital: {
    country: (iso: string) => apiFetch<VitalStats>(`/v1/vital/countries/${iso}`),
  },

  signals: {
    latest: (limit = 50) => apiFetch<IndexScore[]>(`/v1/signals/latest?limit=${limit}`),
    topMovers: () => apiFetch<IndexScore[]>('/v1/signals/top-movers?limit=5'),
  },

  scanStats: (weeks = 12) =>
    apiFetch<{ count: number; data: ScanStats[] }>(`/v1/scan-stats?weeks=${weeks}`),

  methodology: () => apiFetch<MethodologyProvenance>('/v1/methodology'),

  subscribe: (email: string, tier = 'subscriber') =>
    apiFetch<{ ok: boolean; message: string }>('/v1/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tier }),
    }),
};
