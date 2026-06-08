import { Link } from "react-router-dom";

/* Typographic SHE Score wordmark — no coin, no glyph. The two-weight serif
   lockup is the brand mark across the site. */
export function Wordmark({ className = "", as = "link" }: { className?: string; as?: "link" | "span" }) {
  const inner = (
    <span className={`font-serif tracking-tight leading-none ${className}`}>
      <span className="font-bold text-primary">SHE</span>
      <span className="font-normal text-primary/70"> Score</span>
    </span>
  );
  if (as === "span") return inner;
  return (
    <Link to="/" className="inline-flex items-center" aria-label="SHE Score — home">
      {inner}
    </Link>
  );
}
