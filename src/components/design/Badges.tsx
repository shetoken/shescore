import { Check, FlaskConical } from "lucide-react";
import { pillarByKey } from "@/theme/pillars";

/* Gold is highlight-only. The LIVE badge marks a published pillar/score. */
export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gold/15 text-[hsl(var(--gold))] border border-gold/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-gold" /> LIVE
    </span>
  );
}

/* Blue Tick — a verified government/NGO data registrant. */
export function BlueTick({ label = "Verified", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-pillar-education/10 text-pillar-education border border-pillar-education/30 px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      <Check className="h-3 w-3" /> {label}
    </span>
  );
}

/* Shadow badge — v3 pillars in validation (institutional wording). */
export function ShadowBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}>
      <FlaskConical className="h-3 w-3" /> Shadow · in validation
    </span>
  );
}

/* Pillar chip — colour-coded by pillar, used in filters, legends and tags. */
export function PillarChip({ pillarKey, active = false, onClick, className = "" }: {
  pillarKey: string; active?: boolean; onClick?: () => void; className?: string;
}) {
  const p = pillarByKey(pillarKey);
  if (!p) return null;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      style={{ ["--c" as string]: p.hex, background: active ? p.hex : undefined, borderColor: active ? p.hex : undefined }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-smooth
        ${active
          ? "text-white"
          : "text-foreground/80 border-border hover:border-[color:var(--c)]"} ${className}`}
      {...(onClick ? { type: "button", "aria-pressed": active } : {})}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: active ? "#fff" : p.hex }} />
      {p.label}
    </Tag>
  );
}

/* Inline coloured dot for legends. */
export function PillarDot({ pillarKey, className = "" }: { pillarKey: string; className?: string }) {
  const p = pillarByKey(pillarKey);
  if (!p) return null;
  return <span className={`inline-block h-2.5 w-2.5 rounded-full align-middle ${className}`} style={{ background: p.hex }} />;
}
