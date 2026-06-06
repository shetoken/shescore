import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { SITE, NAV_PAGES } from "@/config/manifest";

/* Real 404 (not an SPA shell). Prerendered to dist/404.html and served by Vercel
   for unknown paths. */
export default function NotFound() {
  return (
    <Layout>
      <SEO title="Page not found (404) | SHE Score" description="This page could not be found on shescore.org." url={`${SITE.origin}/404`} />
      <div className="container py-24 max-w-2xl text-center">
        <p className="font-serif text-6xl font-bold text-primary mb-2">404</p>
        <h1 className="font-serif text-2xl font-bold mb-3">This page could not be found</h1>
        <p className="text-foreground/70 mb-8">
          The page you're looking for doesn't exist or has moved. Try one of these:
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <Link to="/" className="text-primary hover:underline">Home</Link>
          {NAV_PAGES.map((p) => (
            <Link key={p.path} to={p.path} className="text-primary hover:underline">{p.navLabel ?? p.title}</Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
