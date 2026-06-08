import type { ReactNode } from "react";

/* Consistent page hero: magenta eyebrow, serif h1, lead paragraph, optional
   trailing slot (badges/actions). */
export function PageHero({
  eyebrow, title, lead, children,
}: { eyebrow: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-background">
      <div className="container py-12 md:py-16 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-magenta-ink mb-3">{eyebrow}</p>
        <h1>{title}</h1>
        {lead && <p className="mt-4 text-lg text-foreground/75">{lead}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
