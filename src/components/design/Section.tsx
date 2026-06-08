import type { ReactNode } from "react";

/* Section heading with an optional eyebrow + lead, on the institutional scale. */
export function SectionHeading({
  eyebrow, title, lead, id, className = "",
}: { eyebrow?: string; title: string; lead?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-magenta-ink mb-2">{eyebrow}</p>
      )}
      <h2 id={id} className="scroll-mt-24">{title}</h2>
      {lead && <p className="mt-3 text-lg text-foreground/75">{lead}</p>}
    </div>
  );
}

/* A standard content section wrapper with generous vertical rhythm. */
export function Section({ children, className = "", bordered = false }: { children: ReactNode; className?: string; bordered?: boolean }) {
  return (
    <section className={`py-12 md:py-16 ${bordered ? "rule" : ""} ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}
