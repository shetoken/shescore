import type { ReactNode } from "react";

/* Every chart on the site is wrapped here so it always carries a title and a
   source line underneath (data-portal convention). Light ground, framed, with
   an explicit source citation — never a chart without provenance. */
export function ChartFrame({
  title, subtitle, source, sourceHref, children, className = "", legend,
}: {
  title: string;
  subtitle?: string;
  source: string;
  sourceHref?: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`rounded-lg border border-border bg-card p-5 shadow-card ${className}`}>
      <figcaption className="mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </figcaption>
      {legend && <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">{legend}</div>}
      <div>{children}</div>
      <p className="source-line">
        Source:{" "}
        {sourceHref ? (
          <a href={sourceHref} className="text-primary hover:underline" target="_blank" rel="noreferrer">{source}</a>
        ) : source}
      </p>
    </figure>
  );
}
