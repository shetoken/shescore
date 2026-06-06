import type { CountryWEI } from "@/lib/api";
import type { ApiVersion } from "@/config/apiVersion";

/* ── Versioned SHE Score weighting ───────────────────────────────────────────
   v2 (OFFICIAL, frozen) is the published five-pillar formula:
     score = E·0.25 + Ed·0.20 + Ec·0.20 + H·0.15 − C·0.20
   v3 (SHADOW preview) reweights the SAME five live pillars — it emphasises
   Economic Inclusion and a heavier Safety/Crime penalty, funded by lighter
   Empowerment and Education weights. No new data and no imputation: v3 is a
   pure reweighting of pillar values that already exist on every country.
   (v3 also TRACKS four candidate expansion pillars in the Lab, but those have
   no qualifying data yet and contribute nothing to the number.)

   v3 is computed as the published v2 score plus the weight-delta applied to each
   pillar. This guarantees v3 == v2 exactly when the weights match (honest
   parity) and makes every point of divergence directly attributable to a weight
   change — and it works identically whether the score came from the live API or
   the committed baseline fallback. v3 NEVER affects published scores or $SHE
   supply mechanics; it is a shadow preview only. */

export interface PillarWeights {
  empowerment: number;
  education: number;
  economic: number;
  health: number;
  crimePenalty: number; // magnitude; subtracted
}

export const V2_WEIGHTS: PillarWeights = {
  empowerment: 0.25, education: 0.20, economic: 0.20, health: 0.15, crimePenalty: 0.20,
};

export const V3_WEIGHTS: PillarWeights = {
  empowerment: 0.20, education: 0.15, economic: 0.25, health: 0.15, crimePenalty: 0.25,
};

/** Side-by-side weight table for methodology displays (v3 panel, Lab, hover). */
export const PILLAR_WEIGHT_TABLE: Array<{ label: string; v2: number; v3: number; penalty?: boolean }> = [
  { label: "Empowerment",            v2: V2_WEIGHTS.empowerment,  v3: V3_WEIGHTS.empowerment },
  { label: "Education & Literacy",   v2: V2_WEIGHTS.education,    v3: V3_WEIGHTS.education },
  { label: "Economic Inclusion",     v2: V2_WEIGHTS.economic,    v3: V3_WEIGHTS.economic },
  { label: "Health & Survival",      v2: V2_WEIGHTS.health,      v3: V3_WEIGHTS.health },
  { label: "Safety (Crime Penalty)", v2: -V2_WEIGHTS.crimePenalty, v3: -V3_WEIGHTS.crimePenalty, penalty: true },
];

export const clampScore = (x: number) => Math.max(0, Math.min(100, x));
export const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * v3 score for a country = published v2 score + the weight-delta applied to each
 * real pillar value. Returns the v2 score unchanged when v3 weights match v2.
 */
export function v3Score(c: CountryWEI): number {
  const base = c.she_score ?? 0;
  const E = c.empowerment_score ?? 0;
  const Ed = c.education_score ?? 0;
  const Ec = c.economic_score ?? 0;
  const H = c.health_score ?? 0;
  const C = c.violence_penalty_score ?? 0;
  const adj =
    E * (V3_WEIGHTS.empowerment - V2_WEIGHTS.empowerment) +
    Ed * (V3_WEIGHTS.education - V2_WEIGHTS.education) +
    Ec * (V3_WEIGHTS.economic - V2_WEIGHTS.economic) +
    H * (V3_WEIGHTS.health - V2_WEIGHTS.health) -
    C * (V3_WEIGHTS.crimePenalty - V2_WEIGHTS.crimePenalty);
  return round1(clampScore(base + adj));
}

/** Returns a copy of the country with `she_score` swapped for the v3 value when
    v3 is selected; the original (v2) object otherwise. Pillar fields untouched. */
export function applyVersion<T extends CountryWEI>(c: T, version: ApiVersion): T {
  if (version !== "v3") return c;
  return { ...c, she_score: v3Score(c) };
}

/** Maps a country list to the selected version's scores. */
export function applyVersionList<T extends CountryWEI>(list: T[], version: ApiVersion): T[] {
  return version === "v3" ? list.map((c) => applyVersion(c, version)) : list;
}

/** Mean SHE Score across a list, rounded to 1 dp (for the global average). */
export function meanScore(list: CountryWEI[]): number | null {
  const vals = list.map((c) => c.she_score).filter((v) => typeof v === "number" && v > 0) as number[];
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
}
