/* The five LIVE pillars — the single source of truth for the SHE Score design
   system. Every chart series, badge, repository filter and legend pulls colour
   and label from here, so the palette is consistent everywhere.

   Colours are a categorical set lightened for legibility on the dark slate ground,
   and they remain distinguishable for colour-vision deficiencies. Keep these hexes
   in sync with the --pillar-* CSS variables in src/index.css. */

export interface Pillar {
  key: "empowerment" | "education" | "economic" | "health" | "safety";
  /** Engine pillar name (config/scoring) */
  engineKey: string;
  /** API field on a country record */
  field: string;
  label: string;
  /** Signed weight in the v2 formula */
  weight: number;
  weightLabel: string;
  hex: string;
  /** Tailwind text class bound to the matching CSS var */
  textClass: string;
  penalty?: boolean;
}

export const PILLARS: Pillar[] = [
  { key: "empowerment", engineKey: "empowerment",        field: "empowerment_score", label: "Empowerment",          weight: 0.25,  weightLabel: "25%",  hex: "#A78BD8", textClass: "text-pillar-empowerment" },
  { key: "education",   engineKey: "education_literacy",  field: "education_score",   label: "Education & Literacy", weight: 0.20,  weightLabel: "20%",  hex: "#5FA0DB", textClass: "text-pillar-education" },
  { key: "economic",    engineKey: "economic_inclusion",  field: "economic_score",    label: "Economic Inclusion",   weight: 0.20,  weightLabel: "20%",  hex: "#5BC289", textClass: "text-pillar-economic" },
  { key: "health",      engineKey: "health_survival",     field: "health_score",      label: "Health & Survival",    weight: 0.15,  weightLabel: "15%",  hex: "#E37FA9", textClass: "text-pillar-health" },
  { key: "safety",      engineKey: "safety_crime_penalty",field: "violence_penalty_score", label: "Safety (Crime Penalty)", weight: -0.20, weightLabel: "−20%", hex: "#E89C5A", textClass: "text-pillar-safety", penalty: true },
];

export const pillarByKey = (key: string) => PILLARS.find((p) => p.key === key);
export const PILLAR_HEXES = PILLARS.map((p) => p.hex);

/** Headline stats used in the stat band. */
export const HEADLINE_STATS: { value: string; label: string }[] = [
  { value: "105", label: "countries" },
  { value: "5", label: "LIVE pillars" },
  { value: "0–100", label: "open scale" },
  { value: "30-day", label: "public challenge window" },
];
