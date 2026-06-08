import { HEADLINE_STATS } from "@/theme/pillars";

/* Large stat blocks — the data-portal "105 countries · 5 pillars · …" band.
   Pass custom stats, or use the headline defaults. */
export function StatBand({
  stats = HEADLINE_STATS,
  className = "",
}: {
  stats?: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <dl className={`grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border ${className}`}>
      {stats.map((s) => (
        <div key={s.label} className="bg-card px-5 py-4">
          <dd className="font-serif text-3xl md:text-4xl font-bold text-primary tnum leading-none">{s.value}</dd>
          <dt className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
