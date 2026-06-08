import type { ReactNode } from "react";

/* Readable long-form column for methodology/governance/about copy. Constrains
   measure and applies the institutional typographic rhythm via @tailwindcss/typography
   with project colours. */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`prose prose-stone max-w-none
        prose-headings:font-serif prose-headings:text-primary
        prose-a:text-primary prose-a:underline-offset-2
        prose-strong:text-foreground
        prose-th:text-foreground
        prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:before:content-none prose-code:after:content-none
        ${className}`}
    >
      {children}
    </div>
  );
}
